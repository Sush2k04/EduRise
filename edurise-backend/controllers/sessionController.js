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
    const session = await Session.findById(req.params.id)
      .populate('instructor', 'skillsToTeach skillsToLearn tokens')
      .populate('learner', 'skillsToTeach skillsToLearn tokens');

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

    if (session.instructor._id.toString() !== req.user.id && session.learner?._id.toString() !== req.user.id) {
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
      if (req.user.id === session.instructor._id.toString()) {
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

    // ========== BARTER TOKEN SYSTEM LOGIC ==========
    try {
      const instructor = session.instructor;
      const learner = session.learner;

      if (instructor && learner) {
        // Get skill arrays (handle both array and undefined cases)
        const instructorSkillsToTeach = instructor.skillsToTeach || [];
        const instructorSkillsToLearn = instructor.skillsToLearn || [];
        const learnerSkillsToLearn = learner.skillsToLearn || [];
        const learnerSkillsToTeach = learner.skillsToTeach || [];

        // Skill being taught in this session
        const taughtSkill = session.skill?.name?.toLowerCase() || '';

        // Case 1: Check if learner WANTS to learn what instructor is teaching
        const doesLearnerWantToLearn = taughtSkill &&
          learnerSkillsToLearn.some(s => s.toLowerCase() === taughtSkill);

        console.log('[Barter] Skill taught:', taughtSkill);
        console.log('[Barter] Learner wants to learn:', doesLearnerWantToLearn);
        console.log('[Barter] Learner skills to teach:', learnerSkillsToTeach);
        console.log('[Barter] Instructor skills to learn:', instructorSkillsToLearn);

        // Case 2: Check if learner can teach back something instructor WANTS to learn
        let canLearnerTeachBack = false;
        for (let skill of learnerSkillsToTeach) {
          if (instructorSkillsToLearn.some(s => s.toLowerCase() === skill.toLowerCase())) {
            canLearnerTeachBack = true;
            session.barterSystem.learnerTaughtBackSkill = {
              name: skill
            };
            break;
          }
        }

        console.log('[Barter] Learner can teach back:', canLearnerTeachBack);

        // Apply token logic
        let instructorTokenChange = 0;
        let learnerTokenChange = 0;

        if (doesLearnerWantToLearn) {
          // ✅ CASE 1: Barter System (Both teach each other)
          if (canLearnerTeachBack) {
            console.log('[Barter] CASE 1: Reciprocal teaching (Barter) - NET = 0 tokens');
            // A taught B + B taught A back = NET ZERO
            session.barterSystem.isReciprocal = true;
            // No token change - they balance out
            instructorTokenChange = 0;
            learnerTokenChange = 0;
          }
          // ✅ CASE 2: One-way teaching (Learner wants to learn but can't teach back)
          else {
            console.log('[Barter] CASE 2: One-way teaching - B gets -1, A gets +1');
            // A teaches B, but B can't teach A
            instructorTokenChange = +1;
            learnerTokenChange = -1;
          }
        } else {
          // ❌ Learner doesn't want to learn this skill => No token exchange
          console.log('[Barter] Learner not interested in this skill - NO TOKEN EXCHANGE');
          instructorTokenChange = 0;
          learnerTokenChange = 0;
        }

        session.barterSystem.instructorTeachingWanted = doesLearnerWantToLearn;
        session.barterSystem.learnerCanTeachBack = canLearnerTeachBack;

        // Update tokens in database
        instructor.tokens = (instructor.tokens || 0) + instructorTokenChange;
        learner.tokens = (learner.tokens || 0) + learnerTokenChange;
        session.tokensExchanged = instructorTokenChange; // Store net change for instructor

        console.log(`[Barter] Token update - Instructor: ${instructorTokenChange > 0 ? '+' : ''}${instructorTokenChange}, Learner: ${learnerTokenChange > 0 ? '+' : ''}${learnerTokenChange}`);

        await Promise.all([
          instructor.save(),
          learner.save(),
          session.save()
        ]);
      }
    } catch (e) {
      console.warn('[Barter] Token exchange failed:', e?.message || e);
    }

    await session.save();

    // Rating system (v1): apply feedback rating to the OTHER user
    try {
      const r = typeof feedback?.rating === 'number' ? feedback.rating : null;
      if (r && r >= 1 && r <= 5) {
        const isInstructorSubmitting = req.user.id === session.instructor._id.toString();
        const targetUserId = isInstructorSubmitting ? session.learner._id : session.instructor._id;
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

    res.json({
      success: true,
      message: 'Session ended successfully',
      barterDetails: session.barterSystem
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

