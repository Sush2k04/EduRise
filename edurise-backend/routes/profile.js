import express from 'express';
import { auth } from '../config/middleware/auth.js';
import { getAllProfiles, getMyProfile, upsertProfile } from '../controllers/profileController.js';

const router = express.Router();

// Create or update profile
router.post('/', auth, upsertProfile);

// Get current user's profile
router.get('/me', auth, getMyProfile);

// Get all profiles (for matching)
router.get('/all', auth, getAllProfiles);

export default router;