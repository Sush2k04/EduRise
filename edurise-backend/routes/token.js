import express from 'express';
import auth from '../config/middleware/auth.js';
import { getBalance, getHistory, markTeaching } from '../controllers/tokenController.js';

const router = express.Router();

router.get('/balance', auth, getBalance);
router.get('/history', auth, getHistory);
router.post('/session/:sessionId/teach', auth, markTeaching);

export default router;

