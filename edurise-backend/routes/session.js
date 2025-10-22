// routes/session.js
import express from 'express';
import auth from '../config/middleware/auth.js';
import Session from '../models/Session.js';

const router = express.Router();

// @route   POST /api/session/create
// @desc    Create a new learning session
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const { skill, sessionType, scheduledDuration } = req.body;

    const session = new Session({
      instructor: req.user.id,
      skill, // { name, category, level }
      sessionType,
      duration: { scheduled: scheduledDuration || 60 },
      status: 'pending'
    });

    await session.save();

    res.json({
      success: true,
      sessionId: session._id,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/session/active
// @desc    Get active sessions for user
// @access  Private
router.get('/active', auth, async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { instructor: req.user.id },
        { learner: req.user.id }
      ],
      status: { $in: ['pending', 'active'] }
    }).populate('instructor learner', 'name avatar skills');

    res.json(sessions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/session/:id/join
// @desc    Join a session as learner
// @access  Private
router.put('/:id/join', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ msg: 'Session is not available' });
    }

    session.learner = req.user.id;
    session.status = 'active';
    session.startTime = new Date();

    await session.save();

    res.json({
      success: true,
      session,
      message: 'Successfully joined session'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/session/:id/end
// @desc    End a session with feedback + notes
// @access  Private
router.put('/:id/end', auth, async (req, res) => {
  try {
    const { feedback, notes } = req.body;

    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    // Ensure only instructor or learner can end
    if (
      session.instructor.toString() !== req.user.id &&
      session.learner?.toString() !== req.user.id
    ) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    session.status = 'completed';
    session.endTime = new Date();

    if (notes) {
      notes.forEach(n => {
        session.notes.push({
          author: req.user.id,
          ...n,
          createdAt: new Date()
        });
      });
    }

    if (feedback) {
      if (req.user.id === session.instructor.toString()) {
        session.feedback.instructorFeedback = {
          ...feedback,
          submittedAt: new Date()
        };
      } else {
        session.feedback.learnerFeedback = {
          ...feedback,
          submittedAt: new Date()
        };
      }
    }

    await session.save();

    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/session/history
// @desc    Get user's completed session history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [
        { instructor: req.user.id },
        { learner: req.user.id }
      ],
      status: 'completed'
    })
      .populate('instructor learner', 'name avatar skills')
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

export default router;
