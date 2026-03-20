import express from 'express';
import { auth } from '../config/middleware/auth.js';
import { getMatches } from '../controllers/matchController.js';

const router = express.Router();

router.get('/', auth, getMatches);

export default router;