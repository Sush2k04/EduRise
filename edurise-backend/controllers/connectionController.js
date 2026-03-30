import Connection from '../models/Connection.js';
import User from '../models/User.js';
import { getIO } from '../sockets/io.js';
import Notification from '../models/Notification.js';

export async function sendRequest(req, res) {
  try {
    const to = req.params.userId;
    const from = req.user.id;
    if (to === from) return res.status(400).json({ msg: 'Cannot connect to yourself' });

    const existing = await Connection.findOne({ from, to });
    if (existing) return res.status(400).json({ msg: `Request already ${existing.status}` });

    const conn = await Connection.create({ from, to, status: 'pending' });

    try {
      const fromUser = await User.findById(from).select('name').lean();
      const notificationPayload = { 
        requestId: conn._id, 
        from, 
        to,
        username: fromUser?.name || 'Someone'
      };
      
      await Notification.create({
        user: to,
        type: 'connection_request',
        payload: notificationPayload
      });
      const io = getIO();
      io?.to(`user:${to}`).emit('notification', {
        type: 'connection_request',
        payload: notificationPayload,
        createdAt: new Date().toISOString()
      });
    } catch {
      // ignore
    }

    res.status(201).json(conn);
  } catch (e) {
    console.error('Connection request error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function acceptRequest(req, res) {
  try {
    const conn = await Connection.findById(req.params.requestId);
    if (!conn) return res.status(404).json({ msg: 'Request not found' });
    if (conn.to.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });
    if (conn.status !== 'pending') return res.status(400).json({ msg: 'Request is not pending' });

    conn.status = 'accepted';
    await conn.save();

    try {
      const toUser = await User.findById(conn.to).select('name').lean();
      const notificationPayload = { 
        requestId: conn._id, 
        from: conn.from, 
        to: conn.to,
        username: toUser?.name || 'Someone'
      };
      
      await Notification.create({
        user: conn.from,
        type: 'connection_accepted',
        payload: notificationPayload
      });
      const io = getIO();
      io?.to(`user:${conn.from.toString()}`).emit('notification', {
        type: 'connection_accepted',
        payload: notificationPayload,
        createdAt: new Date().toISOString()
      });
    } catch {
      // ignore
    }

    res.json(conn);
  } catch (e) {
    console.error('Connection accept error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function rejectRequest(req, res) {
  try {
    const conn = await Connection.findById(req.params.requestId);
    if (!conn) return res.status(404).json({ msg: 'Request not found' });
    if (conn.to.toString() !== req.user.id) return res.status(403).json({ msg: 'Access denied' });
    if (conn.status !== 'pending') return res.status(400).json({ msg: 'Request is not pending' });

    conn.status = 'rejected';
    await conn.save();

    try {
      await Notification.create({
        user: conn.from,
        type: 'connection_rejected',
        payload: { requestId: conn._id, from: conn.from, to: conn.to }
      });
      const io = getIO();
      io?.to(`user:${conn.from.toString()}`).emit('notification', {
        type: 'connection_rejected',
        payload: { requestId: conn._id, from: conn.from, to: conn.to },
        createdAt: new Date().toISOString()
      });
    } catch {
      // ignore
    }

    res.json(conn);
  } catch (e) {
    console.error('Connection reject error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getMyConnections(req, res) {
  try {
    const userId = req.user.id;
    const [incomingPending, outgoingPending, accepted] = await Promise.all([
      Connection.find({ to: userId, status: 'pending' }).populate('from', 'name email avatar rating tokens'),
      Connection.find({ from: userId, status: 'pending' }).populate('to', 'name email avatar rating tokens'),
      Connection.find({
        status: 'accepted',
        $or: [{ from: userId }, { to: userId }]
      })
        .populate('from', 'name email avatar rating tokens')
        .populate('to', 'name email avatar rating tokens')
    ]);

    res.json({ incomingPending, outgoingPending, accepted });
  } catch (e) {
    console.error('Connection list error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function removeConnection(req, res) {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    if (otherUserId === currentUserId) {
      return res.status(400).json({ msg: 'Cannot remove connection with yourself' });
    }

    // Find connection where user is either from or to
    const conn = await Connection.findOne({
      status: 'accepted',
      $or: [
        { from: currentUserId, to: otherUserId },
        { from: otherUserId, to: currentUserId }
      ]
    });

    if (!conn) {
      return res.status(404).json({ msg: 'Connection not found' });
    }

    // Delete the connection
    await Connection.deleteOne({ _id: conn._id });

    res.json({ msg: 'Connection removed successfully', connectionId: conn._id });
  } catch (e) {
    console.error('Connection remove error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

