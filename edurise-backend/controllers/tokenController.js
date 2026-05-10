import Session from '../models/Session.js';
import tokenService from '../services/tokenService.js';

export async function getBalance(req, res) {
  try {
    const data = await tokenService.getBalance(req.user.id);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getHistory(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const transactions = await tokenService.getHistory(req.user.id, limit);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function markTeaching(req, res) {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const userId = req.user.id.toString();
    const userAId = session.instructor?.toString?.();
    const userBId = session.learner?.toString?.();

    if (userId === userAId) session.a_taught_b = true;
    else if (userId === userBId) session.b_taught_a = true;
    else return res.status(403).json({ success: false, message: 'Not a session participant' });

    await session.save();
    res.json({ success: true, message: 'Teaching flag set' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

