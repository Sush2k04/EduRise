import { clamp01, relevanceScore } from '../utils/nlp.js';

// Public demo endpoint: does NOT persist, does NOT require auth.
export async function demoEvaluate(req, res) {
  try {
    const { topic, transcript } = req.body || {};
    if (!topic || !transcript) {
      return res.status(400).json({ msg: 'topic and transcript are required' });
    }

    const relevance = clamp01(relevanceScore(topic, transcript));
    const distractionDelta = clamp01(1 - relevance);

    res.json({
      relevanceScore: relevance,
      distractionDelta
    });
  } catch (e) {
    console.error('TDDS demo error:', e);
    res.status(500).json({ msg: 'Server error' });
  }
}

