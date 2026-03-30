import Notification from '../models/Notification.js';

export async function listMyNotifications(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(notifications);
  } catch (e) {
    console.error('List notifications error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function markRead(req, res) {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { readAt: new Date() } },
      { new: true }
    ).lean();
    if (!n) return res.status(404).json({ msg: 'Notification not found' });
    res.json(n);
  } catch (e) {
    console.error('Mark read error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function markAllRead(req, res) {
  try {
    await Notification.updateMany(
      { user: req.user.id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ success: true });
  } catch (e) {
    console.error('Mark all read error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

