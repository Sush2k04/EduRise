import Profile from '../models/Profile.js';
import User from '../models/User.js';

export async function upsertProfile(req, res) {
  try {
    const { skillsOffer, skillsLearn, availability, bio, level } = req.body;

    const profileFields = {
      user: req.user.id,
      skillsOffer: skillsOffer || [],
      skillsLearn: skillsLearn || [],
      availability: availability || 'Evenings',
      bio: bio || '',
      level: level || 'Intermediate'
    };

    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      ).populate('user', 'name email rating tokens');
    } else {
      profile = new Profile(profileFields);
      await profile.save();
      profile = await Profile.findById(profile._id).populate('user', 'name email rating tokens');
    }

    try {
      await User.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            skillsToTeach: profileFields.skillsOffer,
            skillsToLearn: profileFields.skillsLearn,
            availability: profileFields.availability
          }
        },
        { new: false }
      );
    } catch (e) {
      console.warn('Failed to sync user core fields:', e?.message || e);
    }

    res.json(profile);
  } catch (error) {
    console.error('Profile save error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getMyProfile(req, res) {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      'name email rating tokens avatar'
    );

    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
}

export async function getAllProfiles(req, res) {
  try {
    const profiles = await Profile.find({ user: { $ne: req.user.id } }).populate(
      'user',
      'name email rating tokens avatar'
    );

    res.json(profiles);
  } catch (error) {
    console.error('Profiles fetch error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
}

