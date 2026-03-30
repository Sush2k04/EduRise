const STOPWORDS = new Set([
  'is', 'am', 'are', 'the', 'a', 'an', 'in', 'on', 'at',
  'for', 'to', 'of', 'and', 'with', 'using', 'by', 'from',
  'this', 'that', 'it', 'as', 'be', 'was', 'were', 'will',
  'i', 'you', 'we', 'they', 'he', 'she', 'them', 'our', 'your'
]);

const SYNONYMS = {
  'react.js': 'react',
  reactjs: 'react',
  javascript: 'js',
  nodejs: 'node',
  frontend: 'ui',
  hooks: 'hook',
  components: 'component',
  contexts: 'context'
};

const DOMAIN_KEYWORDS = new Set([
  'react', 'js', 'component', 'hook', 'state', 'context',
  'props', 'redux', 'ui', 'vite', 'jsx', 'router'
]);

function normalizeTokens(text) {
  return (text || '')
    .toLowerCase()
    // keep dots so react.js can be normalized; then split
    .replace(/[^\w\s.]/g, '')
    .split(/\s+/)
    .map((w) => SYNONYMS[w] || w)
    .map((w) => w.replace(/\./g, '')) // react.js -> reactjs -> synonym -> react
    .map((w) => SYNONYMS[w] || w)
    .filter((w) => w && !STOPWORDS.has(w));
}

function freqMap(tokens) {
  const map = new Map();
  for (const t of tokens) map.set(t, (map.get(t) || 0) + 1);
  return map;
}

function cosineFromTokens(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const fa = freqMap(tokensA);
  const fb = freqMap(tokensB);
  const all = new Set([...tokensA, ...tokensB]);

  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const w of all) {
    const a = fa.get(w) || 0;
    const b = fb.get(w) || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function keywordOverlap(tokensA, tokensB) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let overlap = 0;
  for (const w of setA) if (setB.has(w)) overlap += 1;
  return overlap / Math.max(setA.size, 1);
}

function domainBoost(tokens) {
  let count = 0;
  for (const t of tokens) if (DOMAIN_KEYWORDS.has(t)) count += 1;
  return Math.min(count / 3, 1);
}

export function cosineSimilarity(textA, textB) {
  const a = normalizeTokens(textA);
  const b = normalizeTokens(textB);
  return cosineFromTokens(a, b);
}

// Hybrid TDDS relevance score (0..1), deterministic and lightweight.
export function relevanceScore(topic, sentence) {
  const topicTokens = normalizeTokens(topic);
  const sentenceTokens = normalizeTokens(sentence);

  const overlap = keywordOverlap(topicTokens, sentenceTokens);
  const cosine = cosineFromTokens(topicTokens, sentenceTokens);
  const boost = domainBoost(sentenceTokens);

  const score = 0.5 * overlap + 0.3 * cosine + 0.2 * boost;
  return clamp01(score);
}

export function clamp01(x) {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

