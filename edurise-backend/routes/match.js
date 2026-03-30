import express from 'express';
import { auth } from '../config/middleware/auth.js';
import { getMatches, getRecommendations } from '../controllers/matchController.js';

const router = express.Router();

router.get('/', auth, getMatches);
router.get('/recommendations', auth, getRecommendations);

export default router;