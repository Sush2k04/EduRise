import Profile from '../models/Profile.js';
import Connection from '../models/Connection.js';
import recommendationService from '../services/recommendationService.js';

function calculateMatchScore(myProfile, otherProfile) {
  let score = 0;

  if (!otherProfile || !otherProfile.user) return 0;

  const offerToTheirLearn = myProfile.skillsOffer.filter((skill) =>
    otherProfile.skillsLearn.includes(skill)
  ).length;

  const theirOfferToMyLearn = otherProfile.skillsOffer.filter((skill) =>
    myProfile.skillsLearn.includes(skill)
  ).length;

  score += 5 * offerToTheirLearn;
  score += 5 * theirOfferToMyLearn;

  if (myProfile.availability === otherProfile.availability) {
    score += 3;
  }

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const myLevelIndex = levels.indexOf(myProfile.level);
  const theirLevelIndex = levels.indexOf(otherProfile.level);
  const levelDiff = Math.abs(myLevelIndex - theirLevelIndex);
  if (levelDiff <= 1) {
    score += 2;
  }

  score += (otherProfile.user.rating || 5) * 0.2;
  score += (otherProfile.user.tokens || 0) * 0.1;

  const myD = typeof myProfile.user.distractionScore === 'number' ? myProfile.user.distractionScore : 0;
  const otherD = typeof otherProfile.user.distractionScore === 'number' ? otherProfile.user.distractionScore : 0;
  const dDiff = Math.abs(myD - otherD);
  // Stronger preference: match similar distraction profiles
  score += (1 - dDiff) * 4;

  return score;
}

export async function getMatches(req, res) {
  try {
    const myProfile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      'rating tokens distractionScore'
    );

    if (!myProfile) {
      return res.status(400).json({ msg: 'Complete your profile first' });
    }

    const otherProfiles = await Profile.find({ user: { $ne: req.user.id } }).populate(
      'user',
      'name email rating tokens avatar distractionScore'
    );

    const recommended = otherProfiles
      .filter((p) => !!p?.user) // skip profiles with missing/deleted user reference
      .map((profile) => ({
        profile,
        score: calculateMatchScore(myProfile, profile)
      }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((match) => ({
        userId: match.profile.user._id,
        name: match.profile.user.name,
        email: match.profile.user.email,
        avatar: match.profile.user.avatar,
        score: Math.round(match.score * 100) / 100,
        skillsOffer: match.profile.skillsOffer,
        skillsLearn: match.profile.skillsLearn,
        availability: match.profile.availability,
        level: match.profile.level,
        bio: match.profile.bio,
        tokens: match.profile.user.tokens,
        rating: match.profile.user.rating,
        distractionScore: match.profile.user.distractionScore ?? 0
      }));

    const otherIds = recommended.map((m) => m.userId);
    const statusByUserId = {};

    // Fetch existing connection state in a single query (both directions).
    if (otherIds.length > 0) {
      const connections = await Connection.find({
        $or: [
          { from: req.user.id, to: { $in: otherIds } },
          { from: { $in: otherIds }, to: req.user.id }
        ]
      }).select('from to status');

      for (const c of connections) {
        const peerId =
          String(c.from) === String(req.user.id) ? String(c.to) : String(c.from);

        if (c.status === 'accepted') {
          statusByUserId[peerId] = 'accepted';
        } else if (c.status === 'pending' && statusByUserId[peerId] !== 'accepted') {
          statusByUserId[peerId] = 'pending';
        }
      }
    }

    const maxScore = Math.max(...recommended.map((m) => m.score || 0), 1);
    const matches = recommended.map((m) => ({
      ...m,
      connectionStatus: statusByUserId[String(m.userId)] || 'none',
      // Provide a UI-friendly 0..100 badge without changing the existing `score`.
      scores: { overall: Math.round(((m.score || 0) / maxScore) * 100) }
    }));

    res.json(matches);
  } catch (error) {
    console.error('Match calculation error:', error);
    res.status(500).json({ msg: 'Server error during matching' });
  }
}

// New AI recommendations endpoint (additive; does not break GET /api/match)
export async function getRecommendations(req, res) {
  try {
    const recommendations = await recommendationService.getRecommendations(req.user.id, 10);
    res.json({ success: true, recommendations });
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
}

