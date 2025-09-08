import express from 'express';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { auth } from '../config/middleware/auth.js';

const router = express.Router();

// Create or update profile
router.post('/', auth, async (req, res) => {
  try {
    const { skillsOffer, skillsLearn, availability, bio, level } = req.body;
    
    // Build profile object
    const profileFields = {
      user: req.user.id,
      skillsOffer: skillsOffer || [],
      skillsLearn: skillsLearn || [],
      availability: availability || 'Evenings',
      bio: bio || '',
      level: level || 'Intermediate'
    };

    // Update or create profile
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      ).populate('user', 'name email rating tokens');
    } else {
      // Create new profile
      profile = new Profile(profileFields);
      await profile.save();
      profile = await Profile.findById(profile._id).populate('user', 'name email rating tokens');
    }

    res.json(profile);
  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get current user's profile
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })
      .populate('user', 'name email rating tokens avatar');
    
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all profiles (for matching)
router.get('/all', auth, async (req, res) => {
  try {
    const profiles = await Profile.find({ user: { $ne: req.user.id } })
      .populate('user', 'name email rating tokens avatar');
    
    res.json(profiles);
  } catch (error) {
    console.error('Profiles fetch error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;