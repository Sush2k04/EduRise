import Session from '../models/Session.js';
import User from '../models/User.js';

function minutesBetween(a, b) {
  if (!a || !b) return null;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60)));
}

export async function createSession(req, res) {
  try {
    const { skill, sessionType, scheduledDuration, scheduledAt, topic, tokenRate } = req.body;
    if (!skill?.name || !skill?.category) {
      return res.status(400).json({ msg: 'skill.name and skill.category are required' });
    }

    const session = new Session({
      instructor: req.user.id,
      skill,
      sessionType,
      duration: { scheduled: scheduledDuration || 60 },
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      topic: topic || skill?.name || 'General',
      tokenRate: typeof tokenRate === 'number' ? tokenRate : undefined,
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
}

// Learner books a session with a chosen instructor
// POST /api/session/book
export async function bookSession(req, res) {
  try {
    const { instructorId, skill, sessionType, scheduledDuration, scheduledAt, topic, tokenRate } = req.body;
    if (!instructorId) return res.status(400).json({ msg: 'instructorId is required' });
    if (!skill?.name || !skill?.category) return res.status(400).json({ msg: 'skill.name and skill.category are required' });

    const session = new Session({
      instructor: instructorId,
      learner: req.user.id,
      skill,
      sessionType,
      duration: { scheduled: scheduledDuration || 60 },
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      topic: topic || skill?.name || 'General',
      tokenRate: typeof tokenRate === 'number' ? tokenRate : undefined,
      status: 'pending'
    });

    await session.save();

    res.status(201).json({
      success: true,
      sessionId: session._id,
      message: 'Session booked successfully'
    });
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
}

export async function getActiveSessions(req, res) {
  try {
    const sessions = await Session.find({
      $or: [{ instructor: req.user.id }, { learner: req.user.id }],
      status: { $in: ['pending', 'active'] }
    }).populate('instructor learner', 'name avatar skills');

    res.json(sessions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

export async function joinSession(req, res) {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ msg: 'Session is not available' });
    }

    const isInstructor = session.instructor.toString() === req.user.id;

    // If learner already exists, only that learner can "join" as learner.
    // Instructor is allowed to join to activate the session.
    if (!isInstructor) {
      if (session.learner && session.learner.toString() !== req.user.id) {
        return res.status(400).json({ msg: 'Session already has a learner' });
      }
      session.learner = req.user.id;
    } else {
      // Instructor can activate even if learner is already set (booked session).
      if (!session.learner) {
        return res.status(400).json({ msg: 'No learner has booked this session yet' });
      }
    }

    session.status = 'active';
    session.startTime = new Date();

    await session.save();

    try {
      await User.updateMany(
        { _id: { $in: [session.instructor, session.learner] } },
        { $addToSet: { sessionHistory: session._id } }
      );
    } catch {
      // ignore
    }

    res.json({
      success: true,
      session,
      message: 'Successfully joined session'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

export async function endSession(req, res) {
  try {
    const { feedback, notes, tokensExchanged } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.instructor.toString() !== req.user.id && session.learner?.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    session.status = 'completed';
    session.endTime = new Date();
    session.duration.actual = minutesBetween(session.startTime, session.endTime);

    if (notes) {
      notes.forEach((n) => {
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

    // Rating system (v1): apply feedback rating to the OTHER user
    try {
      const r = typeof feedback?.rating === 'number' ? feedback.rating : null;
      if (r && r >= 1 && r <= 5) {
        const isInstructorSubmitting = req.user.id === session.instructor.toString();
        const targetUserId = isInstructorSubmitting ? session.learner : session.instructor;
        if (targetUserId) {
          const target = await User.findById(targetUserId);
          if (target) {
            target.ratingCount = (target.ratingCount || 0) + 1;
            target.ratingSum = (target.ratingSum || 0) + r;
            target.rating = Math.round(((target.ratingSum / target.ratingCount) || 5) * 10) / 10;
            await target.save();
          }
        }
      }
    } catch (e) {
      console.warn('Rating update failed:', e?.message || e);
    }

    // Token system (v1): learner pays instructor
    try {
      if (session.learner) {
        const minutes = session.duration.actual ?? session.duration.scheduled ?? 60;
        const rate = session.tokenRate ?? 1 / 30;
        const computed = Math.max(1, Math.round(minutes * rate));
        const amount = typeof tokensExchanged === 'number' ? tokensExchanged : computed;

        const [instructor, learner] = await Promise.all([
          User.findById(session.instructor),
          User.findById(session.learner)
        ]);

        if (instructor && learner) {
          const spend = Math.min(learner.tokens || 0, amount);
          learner.tokens = (learner.tokens || 0) - spend;
          instructor.tokens = (instructor.tokens || 0) + spend;
          session.tokensExchanged = spend;
          await Promise.all([learner.save(), instructor.save(), session.save()]);
        }
      }
    } catch (e) {
      console.warn('Token exchange failed:', e?.message || e);
    }

    res.json({
      success: true,
      message: 'Session ended successfully'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

export async function getHistory(req, res) {
  try {
    const sessions = await Session.find({
      $or: [{ instructor: req.user.id }, { learner: req.user.id }],
      status: 'completed'
    })
      .populate('instructor learner', 'name avatar skills')
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

export async function getSessionById(req, res) {
  try {
    const session = await Session.findById(req.params.id)
      .populate('instructor learner', 'name email avatar rating tokens distractionScore')
      .lean();
    if (!session) return res.status(404).json({ msg: 'Session not found' });

    const userId = req.user.id;
    if (session.instructor?._id?.toString() !== userId && session.learner?._id?.toString() !== userId) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(session);
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
}

