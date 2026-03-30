/**
 * Enhanced TDDS Service
 * Uses @xenova/transformers (local embeddings) when available.
 * Falls back to deterministic `utils/nlp.js` scoring if model fails to load.
 *
 * All scores in this codebase are normalized to 0..1 to match existing TDDS v1 APIs.
 */

import { clamp01, relevanceScore as legacyRelevanceScore } from '../utils/nlp.js';

let embeddingPipeline = null;
let embeddingPipelineInit = null;

async function getEmbeddingPipeline() {
  if (embeddingPipeline) return embeddingPipeline;
  if (embeddingPipelineInit) return embeddingPipelineInit;

  embeddingPipelineInit = (async () => {
    try {
      const { pipeline } = await import('@xenova/transformers');
      embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('[TDDS] Embedding model loaded');
      return embeddingPipeline;
    } catch (err) {
      console.error('[TDDS] Failed to load embedding model:', err?.message || err);
      embeddingPipeline = null;
      return null;
    } finally {
      embeddingPipelineInit = null;
    }
  })();

  return embeddingPipelineInit;
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const n = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < n; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const DISTRACTION_PATTERNS = [
  /\b(lol|lmao|omg|wtf|brb|idk|umm+|uh+|err+)\b/gi,
  /\b(bored|tired|hungry|sleepy|netflix|game|party|meme)\b/gi,
  /[!?]{2,}/g
];

function computeFillerScore01(text) {
  const words = (text || '').split(/\s+/).filter(Boolean);
  const denom = Math.max(words.length, 1);
  let count = 0;
  for (const pattern of DISTRACTION_PATTERNS) {
    const matches = (text || '').match(pattern);
    if (matches) count += matches.length;
  }
  // Scale into 0..1
  return clamp01((count / denom) * 5);
}

async function getEmbedding01(text) {
  const pipe = await getEmbeddingPipeline();
  if (!pipe) return null;
  const clipped = (text || '').slice(0, 1000);
  const output = await pipe(clipped, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

const tddsService = {
  async computeRelevance01(transcript, topic) {
    if (!transcript || !topic) return 0.5;
    try {
      const [tVec, topicVec] = await Promise.all([
        getEmbedding01(transcript),
        getEmbedding01(topic)
      ]);
      if (!tVec || !topicVec) {
        // fallback: existing deterministic method
        return clamp01(legacyRelevanceScore(topic, transcript));
      }
      // cosine is already roughly -1..1 due to normalize:true, map to 0..1
      const sim = cosineSimilarity(tVec, topicVec);
      return clamp01((sim + 1) / 2);
    } catch (err) {
      console.error('[TDDS] Relevance compute error:', err?.message || err);
      return clamp01(legacyRelevanceScore(topic, transcript));
    }
  },

  computeDistraction01(transcript) {
    if (!transcript) return 0;
    return clamp01(computeFillerScore01(transcript));
  },

  async analyze(transcript, topic) {
    const [relevanceScore, distractionScore] = await Promise.all([
      this.computeRelevance01(transcript, topic || 'general'),
      Promise.resolve(this.computeDistraction01(transcript))
    ]);
    return { relevanceScore, distractionScore };
  }
};

export default tddsService;

