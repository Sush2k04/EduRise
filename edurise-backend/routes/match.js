import express from 'express';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { auth } from '../config/middleware/auth.js';

const router = express.Router();

// Calculate match score
function calculateMatchScore(myProfile, otherProfile) {
  let score = 0;
  
  // Skill matching (offer ↔ learn)
  const offerToTheirLearn = myProfile.skillsOffer.filter(skill => 
    otherProfile.skillsLearn.includes(skill)
  ).length;
  
  const theirOfferToMyLearn = otherProfile.skillsOffer.filter(skill => 
    myProfile.skillsLearn.includes(skill)
  ).length;
  
  score += 5 * offerToTheirLearn;
  score += 5 * theirOfferToMyLearn;
  
  // Availability match
  if (myProfile.availability === otherProfile.availability) {
    score += 3;
  }
  
  // Level compatibility
  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const myLevelIndex = levels.indexOf(myProfile.level);
  const theirLevelIndex = levels.indexOf(otherProfile.level);
  const levelDiff = Math.abs(myLevelIndex - theirLevelIndex);
  
  if (levelDiff <= 1) {
    score += 2;
  }
  
  // Rating and tokens (reputation factors)
  score += (otherProfile.user.rating || 5) * 0.2;
  score += (otherProfile.user.tokens || 0) * 0.1;
  
  return score;
}

// Get matches
router.get('/', auth, async (req, res) => {
  try {
    // Get current user's profile
    const myProfile = await Profile.findOne({ user: req.user.id })
      .populate('user', 'rating tokens');
    
    if (!myProfile) {
      return res.status(400).json({ msg: 'Complete your profile first' });
    }
    
    // Get other profiles
    const otherProfiles = await Profile.find({ user: { $ne: req.user.id } })
      .populate('user', 'name email rating tokens avatar');
    
    // Calculate match scores
    const matches = otherProfiles
      .map(profile => ({
        profile,
        score: calculateMatchScore(myProfile, profile)
      }))
      .filter(match => match.score > 0) // Only include matches with positive score
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Top 10 matches
      .map(match => ({
        userId: match.profile.user._id,
        name: match.profile.user.name,
        email: match.profile.user.email,
        avatar: match.profile.user.avatar,
        score: Math.round(match.score * 100) / 100, // Round to 2 decimal places
        skillsOffer: match.profile.skillsOffer,
        skillsLearn: match.profile.skillsLearn,
        availability: match.profile.availability,
        level: match.profile.level,
        bio: match.profile.bio,
        tokens: match.profile.user.tokens,
        rating: match.profile.user.rating
      }));
    
    res.json(matches);
  } catch (error) {
    console.error('Match calculation error:', error);
    res.status(500).json({ msg: 'Server error during matching' });
  }
});

export default router;