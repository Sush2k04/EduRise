// routes/session.js
import express from 'express';
import auth from '../config/middleware/auth.js';
import {
  bookSession,
  createSession,
  endSession,
  getActiveSessions,
  getHistory,
  getSessionById,
  joinSession
} from '../controllers/sessionController.js';

const router = express.Router();

// @route   POST /api/session/create
// @desc    Create a new learning session
// @access  Private
router.post('/create', auth, createSession);
router.post('/book', auth, bookSession);

// @route   GET /api/session/active
// @desc    Get active sessions for user
// @access  Private
router.get('/active', auth, getActiveSessions);

// @route   PUT /api/session/:id/join
// @desc    Join a session as learner
// @access  Private
router.put('/:id/join', auth, joinSession);

// @route   PUT /api/session/:id/end
// @desc    End a session with feedback + notes
// @access  Private
router.put('/:id/end', auth, endSession);

// @route   GET /api/session/history
// @desc    Get user's completed session history
// @access  Private
router.get('/history', auth, getHistory);

// @route   GET /api/session/:id
// @desc    Get session by id
// @access  Private
router.get('/:id', auth, getSessionById);

export default router;
