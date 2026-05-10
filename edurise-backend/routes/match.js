import express from 'express';
import { auth } from '../config/middleware/auth.js';
<<<<<<< HEAD
import { getMatches } from '../controllers/matchController.js';
=======
import { getMatches, getRecommendations } from '../controllers/matchController.js';
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57

const router = express.Router();

router.get('/', auth, getMatches);
<<<<<<< HEAD
=======
router.get('/recommendations', auth, getRecommendations);
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57

export default router;