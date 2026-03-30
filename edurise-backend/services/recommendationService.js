import Profile from '../models/Profile.js';
import Connection from '../models/Connection.js';

function normalizeSkills(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((s) => String(s || '').toLowerCase().trim())
    .filter(Boolean);
}

// Jaccard similarity between two arrays of strings (skills)
function jaccardSimilarity(setA, setB) {
  const a = new Set(normalizeSkills(setA));
  const b = new Set(normalizeSkills(setB));
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection += 1;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function levelOf(score01) {
  const s = typeof score01 === 'number' ? score01 : 0.5;
  if (s < 0.3) return 'low';
  if (s <= 0.7) return 'medium';
  return 'high';
}

// Distraction compatibility: users with similar distraction levels match better
function distractionCompatibility(scoreA01, scoreB01) {
  const lA = levelOf(scoreA01);
  const lB = levelOf(scoreB01);
  if (lA === lB) return 1.0;
  const levels = ['low', 'medium', 'high'];
  const diff = Math.abs(levels.indexOf(lA) - levels.indexOf(lB));
  return diff === 1 ? 0.5 : 0.2;
}

const recommendationService = {
  async getRecommendations(userId, limit = 10) {
    const myProfile = await Profile.findOne({ user: userId }).lean();
    if (!myProfile) return [];

    const myTeach = myProfile.skillsOffer || [];
    const myLearn = myProfile.skillsLearn || [];
    const myDistraction = myProfile.avgDistractionScore ?? 0.5;

    // Candidates with profiles
    const allProfiles = await Profile.find({ user: { $ne: userId } })
      .populate('user', 'name email avatar')
      .lean();

    // Connection status lookup (both directions)
    const candidateIds = allProfiles
      .map((p) => p?.user?._id)
      .filter(Boolean);

    const statusByUserId = {};
    if (candidateIds.length > 0) {
      const connections = await Connection.find({
        $or: [
          { from: userId, to: { $in: candidateIds } },
          { from: { $in: candidateIds }, to: userId }
        ],
        status: { $in: ['pending', 'accepted'] }
      }).select('from to status');

      for (const c of connections) {
        const peerId =
          String(c.from) === String(userId) ? String(c.to) : String(c.from);
        if (c.status === 'accepted') statusByUserId[peerId] = 'accepted';
        else if (c.status === 'pending' && statusByUserId[peerId] !== 'accepted') statusByUserId[peerId] = 'pending';
      }
    }

    const scored = allProfiles
      .filter((p) => !!p?.user?._id)
      .map((candidateProfile) => {
        const theirTeach = candidateProfile.skillsOffer || [];
        const theirLearn = candidateProfile.skillsLearn || [];
        const theirDistraction = candidateProfile.avgDistractionScore ?? 0.5;

        // Can they teach what I want to learn?
        const teachMeScore = jaccardSimilarity(theirTeach, myLearn);
        // Can I teach what they want to learn?
        const iTeachThemScore = jaccardSimilarity(myTeach, theirLearn);
        // Skill match: average of both directions
        const skillMatchScore = teachMeScore * 0.6 + iTeachThemScore * 0.4;

        const distractionScore = distractionCompatibility(myDistraction, theirDistraction);
        const finalScore = skillMatchScore * 0.7 + distractionScore * 0.3;

        const overallPct = Math.round(finalScore * 100);

        return {
          userId: candidateProfile.user._id,
          name: candidateProfile.user.name,
          email: candidateProfile.user.email,
          avatar: candidateProfile.user.avatar,
          skillsOffer: theirTeach,
          skillsLearn: theirLearn,
          availability: candidateProfile.availability,
          level: candidateProfile.level,
          bio: candidateProfile.bio,
          scores: {
            skillMatch: Math.round(skillMatchScore * 100),
            distractionCompatibility: Math.round(distractionScore * 100),
            overall: overallPct
          },
          connectionStatus: statusByUserId[String(candidateProfile.user._id)] || 'none'
        };
      })
      .sort((a, b) => (b.scores?.overall || 0) - (a.scores?.overall || 0))
      .slice(0, limit);

    return scored;
  }
};

export default recommendationService;

