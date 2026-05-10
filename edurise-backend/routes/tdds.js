import express from 'express';
import { auth } from '../config/middleware/auth.js';
<<<<<<< HEAD
import { evaluate, myHistory, mySummary, sessionEvaluations } from '../controllers/tddsController.js';
=======
import { analyzeSession, evaluate, myHistory, mySummary, sessionEvaluations } from '../controllers/tddsController.js';
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
import { demoEvaluate } from '../controllers/tddsDemoController.js';

const router = express.Router();

// TDDS v1 (mock): audio->text is assumed done client-side or mocked.
// Input: { topic: string, transcript: string }
// Output: { relevanceScore: 0..1, distractionDelta: 0..1, userDistractionScore: 0..1 }
router.post('/evaluate', auth, evaluate);
<<<<<<< HEAD
=======
router.post('/analyze', auth, analyzeSession);
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
router.get('/me', auth, mySummary);
router.get('/history', auth, myHistory);
router.get('/session/:sessionId', auth, sessionEvaluations);
router.post('/demo', demoEvaluate);

export default router;

