import User from '../models/User.js';
import { clamp01, relevanceScore } from '../utils/nlp.js';
import TddsEvaluation from '../models/TddsEvaluation.js';

export async function evaluate(req, res) {
  try {
    const { topic, transcript, sessionId } = req.body || {};
    if (!topic || !transcript) {
      return res.status(400).json({ msg: 'topic and transcript are required' });
    }

    const relevance = clamp01(relevanceScore(topic, transcript));
    const distraction = clamp01(1 - relevance);

    const alpha = 0.2;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const prev = typeof user.distractionScore === 'number' ? user.distractionScore : 0;
    const next = clamp01(prev * (1 - alpha) + distraction * alpha);
    user.distractionScore = next;
    await user.save();

    try {
      await TddsEvaluation.create({
        user: req.user.id,
        session: sessionId || undefined,
        topic,
        transcript,
        relevanceScore: relevance,
        distractionDelta: distraction
      });
    } catch {
      // ignore
    }

    res.json({
      relevanceScore: relevance,
      distractionDelta: distraction,
      userDistractionScore: next
    });
  } catch (e) {
    console.error('TDDS evaluate error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function mySummary(req, res) {
  try {
    const user = await User.findById(req.user.id).select('distractionScore').lean();
    const recent = await TddsEvaluation.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const avgRelevance =
      recent.length === 0
        ? null
        : recent.reduce((acc, r) => acc + (r.relevanceScore || 0), 0) / recent.length;

    res.json({
      distractionScore: user?.distractionScore ?? 0,
      recentCount: recent.length,
      avgRelevance: avgRelevance === null ? null : Math.round(avgRelevance * 100) / 100
    });
  } catch (e) {
    console.error('TDDS summary error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function myHistory(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);
    const items = await TddsEvaluation.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('session topic relevanceScore distractionDelta createdAt')
      .lean();
    res.json(items);
  } catch (e) {
    console.error('TDDS history error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function sessionEvaluations(req, res) {
  try {
    const sessionId = req.params.sessionId;
    const items = await TddsEvaluation.find({ session: sessionId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email avatar')
      .lean();

    // Group by user for “stored individually per participant”
    const byUser = {};
    for (const it of items) {
      const uid = it.user?._id?.toString?.() || 'unknown';
      if (!byUser[uid]) {
        byUser[uid] = {
          user: it.user,
          evaluations: []
        };
      }
      byUser[uid].evaluations.push({
        _id: it._id,
        topic: it.topic,
        transcript: it.transcript,
        relevanceScore: it.relevanceScore,
        distractionDelta: it.distractionDelta,
        createdAt: it.createdAt
      });
    }

    res.json({ sessionId, byUser });
  } catch (e) {
    console.error('TDDS session eval error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

