import Connection from '../models/Connection.js';
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
      await Notification.create({
        user: to,
        type: 'connection_request',
        payload: { requestId: conn._id, from, to }
      });
      const io = getIO();
      io?.to(`user:${to}`).emit('notification', {
        type: 'connection_request',
        payload: { requestId: conn._id, from, to },
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
      await Notification.create({
        user: conn.from,
        type: 'connection_accepted',
        payload: { requestId: conn._id, from: conn.from, to: conn.to }
      });
      const io = getIO();
      io?.to(`user:${conn.from.toString()}`).emit('notification', {
        type: 'connection_accepted',
        payload: { requestId: conn._id, from: conn.from, to: conn.to },
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

