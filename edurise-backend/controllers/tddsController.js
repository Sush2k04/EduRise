import User from '../models/User.js';
import { clamp01, relevanceScore } from '../utils/nlp.js';
import TddsEvaluation from '../models/TddsEvaluation.js';
import Profile from '../models/Profile.js';
import Session from '../models/Session.js';
import tddsService from '../services/tddsService.js';

async function updateUserAverages(userId) {
  const items = await TddsEvaluation.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('relevanceScore distractionDelta distractionScore')
    .lean();

  if (items.length === 0) return;

  const avgRel = items.reduce((acc, r) => acc + (r.relevanceScore || 0), 0) / items.length;
  const avgDis = items.reduce((acc, r) => acc + (r.distractionScore ?? r.distractionDelta ?? 0), 0) / items.length;

  await Profile.findOneAndUpdate(
    { user: userId },
    { avgRelevanceScore: clamp01(avgRel), avgDistractionScore: clamp01(avgDis) },
    { new: false }
  );
}

// TDDS v2: AI-powered analyze endpoint (non-breaking addition)
export async function analyzeSession(req, res) {
  try {
    const { sessionId, transcript, topic } = req.body || {};
    if (!sessionId || !transcript) {
      return res.status(400).json({ success: false, message: 'sessionId and transcript required' });
    }

    const session = await Session.findById(sessionId).select('instructor learner topic skill status').lean();
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const resolvedTopic = topic || session.topic || session.skill?.name || 'general';
    const { relevanceScore, distractionScore } = await tddsService.analyze(transcript, resolvedTopic);

    // Persist per-user evaluation (keeps compatibility with existing TDDS history views)
    const saved = await TddsEvaluation.findOneAndUpdate(
      { user: req.user.id, session: sessionId, topic: resolvedTopic },
      {
        user: req.user.id,
        session: sessionId,
        topic: resolvedTopic,
        transcript,
        relevanceScore: clamp01(relevanceScore),
        distractionDelta: clamp01(1 - relevanceScore),
        distractionScore: clamp01(distractionScore)
      },
      { upsert: true, new: true }
    ).lean();

    // Update averages for both participants when possible
    try {
      await updateUserAverages(req.user.id);
      if (session.instructor) await updateUserAverages(session.instructor);
      if (session.learner) await updateUserAverages(session.learner);
    } catch {
      // ignore
    }

    res.json({ success: true, evaluation: saved });
  } catch (err) {
    console.error('TDDS analyze error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

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

