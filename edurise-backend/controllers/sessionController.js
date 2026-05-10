<<<<<<< HEAD
import Session from '../models/Session.js';
import User from '../models/User.js';
=======
import Session, { LIVE_SESSION_STATUSES } from '../models/Session.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import Notification from '../models/Notification.js';
import { getIO } from '../sockets/io.js';
import tokenService from '../services/tokenService.js';
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57

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
<<<<<<< HEAD
=======
/** Start a session with a connected peer (creator = instructor, invitee = learner). */
export async function startSessionWithPeer(req, res) {
  try {
    const {
      peerUserId,
      topic,
      skill,
      sessionType,
      scheduledDuration
    } = req.body;

    if (!peerUserId) {
      return res.status(400).json({ msg: 'peerUserId is required' });
    }
    if (peerUserId === req.user.id) {
      return res.status(400).json({ msg: 'Cannot start a session with yourself' });
    }

    const peer = await User.findById(peerUserId).select('_id');
    if (!peer) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const connection = await Connection.findOne({
      status: 'accepted',
      $or: [
        { from: req.user.id, to: peerUserId },
        { from: peerUserId, to: req.user.id }
      ]
    });
    if (!connection) {
      return res.status(403).json({ msg: 'You must be connected with this user to start a session' });
    }

    const conflict = await Session.findOne({
      $or: [
        { instructor: req.user.id },
        { learner: req.user.id },
        { instructor: peerUserId },
        { learner: peerUserId }
      ],
      status: { $in: LIVE_SESSION_STATUSES }
    });
    if (conflict) {
      return res.status(409).json({ msg: 'A session is already pending or live for one of you' });
    }

    const skillPayload =
      skill?.name && skill?.category
        ? {
            name: skill.name,
            category: skill.category,
            level: skill.level || 'beginner'
          }
        : {
            name: 'General',
            category: 'General',
            level: 'beginner'
          };

    const session = new Session({
      instructor: req.user.id,
      learner: peerUserId,
      skill: skillPayload,
      sessionType: sessionType || 'video',
      duration: { scheduled: scheduledDuration || 60 },
      topic: topic || skillPayload.name || 'General',
      tokenRate: typeof req.body.tokenRate === 'number' ? req.body.tokenRate : undefined,
      status: 'pending',
      participantsJoined: []
    });

    await session.save();

    const populated = await Session.findById(session._id)
      .populate('instructor learner', 'name email avatar')
      .lean();

    try {
      const fromUser = await User.findById(req.user.id).select('name').lean();
      const notificationPayload = { 
        sessionId: session._id, 
        from: req.user.id,
        username: fromUser?.name || 'Someone'
      };
      
      await Notification.create({
        user: peerUserId,
        type: 'session_invite',
        payload: notificationPayload
      });
      const io = getIO();
      const sid = session._id.toString();
      io?.to(`user:${peerUserId}`).emit('session-invite', {
        sessionId: sid,
        session: populated,
        from: req.user.id
      });
      io?.to(`user:${peerUserId}`).emit('notification', {
        type: 'session_invite',
        payload: notificationPayload,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('session-invite notify failed:', e?.message || e);
    }

    res.status(201).json({
      success: true,
      sessionId: session._id,
      session: populated
    });
  } catch (e) {
    console.error(e.message);
    res.status(500).send('Server Error');
  }
}

>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
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
<<<<<<< HEAD
      status: { $in: ['pending', 'active'] }
=======
      status: { $in: LIVE_SESSION_STATUSES }
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
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

<<<<<<< HEAD
    if (session.status !== 'pending') {
=======
    if (!LIVE_SESSION_STATUSES.includes(session.status)) {
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
      return res.status(400).json({ msg: 'Session is not available' });
    }

    const isInstructor = session.instructor.toString() === req.user.id;

<<<<<<< HEAD
    // If learner already exists, only that learner can "join" as learner.
    // Instructor is allowed to join to activate the session.
=======
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
    if (!isInstructor) {
      if (session.learner && session.learner.toString() !== req.user.id) {
        return res.status(400).json({ msg: 'Session already has a learner' });
      }
<<<<<<< HEAD
      session.learner = req.user.id;
    } else {
      // Instructor can activate even if learner is already set (booked session).
      if (!session.learner) {
        return res.status(400).json({ msg: 'No learner has booked this session yet' });
      }
    }

    session.status = 'active';
    session.startTime = new Date();
=======
      if (!session.learner) {
        session.learner = req.user.id;
      }
    } else if (!session.learner) {
      return res.status(400).json({ msg: 'No learner has booked this session yet' });
    }

    const uid = req.user.id;
    if (!session.participantsJoined) {
      session.participantsJoined = [];
    }
    if (!session.participantsJoined.some((id) => id.toString() === uid)) {
      session.participantsJoined.push(uid);
    }

    const instId = session.instructor.toString();
    const learnId = session.learner?.toString();
    const joinedIds = new Set(session.participantsJoined.map((id) => id.toString()));
    const both =
      learnId && joinedIds.has(instId) && joinedIds.has(learnId);

    const wasOngoing =
      session.status === 'ongoing' || session.status === 'active';

    if (both) {
      if (session.status === 'pending' || session.status === 'active') {
        session.status = 'ongoing';
        if (!session.startTime) {
          session.startTime = new Date();
        }
      }
    }
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57

    await session.save();

    try {
      await User.updateMany(
<<<<<<< HEAD
        { _id: { $in: [session.instructor, session.learner] } },
=======
        {
          _id: {
            $in: [session.instructor, session.learner].filter(Boolean)
          }
        },
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
        { $addToSet: { sessionHistory: session._id } }
      );
    } catch {
      // ignore
    }

<<<<<<< HEAD
    res.json({
      success: true,
      session,
      message: 'Successfully joined session'
=======
    const nowOngoing = session.status === 'ongoing';
    if (both && !wasOngoing && nowOngoing) {
      const io = getIO();
      const sid = session._id.toString();
      const populated = await Session.findById(session._id)
        .populate('instructor learner', 'name email avatar')
        .lean();
      io?.to(sid).emit('session-started', {
        sessionId: sid,
        session: populated
      });
    }

    res.json({
      success: true,
      session,
      waitingForPeer: !both,
      message: both
        ? 'Session is live'
        : 'Waiting for the other participant to join'
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

export async function endSession(req, res) {
  try {
    const { feedback, notes, tokensExchanged } = req.body;
<<<<<<< HEAD
    const session = await Session.findById(req.params.id)
      .populate('instructor', 'skillsToTeach skillsToLearn tokens')
      .populate('learner', 'skillsToTeach skillsToLearn tokens');
=======
    const session = await Session.findById(req.params.id);
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57

    if (!session) {
      return res.status(404).json({ msg: 'Session not found' });
    }

<<<<<<< HEAD
    if (session.instructor._id.toString() !== req.user.id && session.learner?._id.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

=======
    if (session.instructor.toString() !== req.user.id && session.learner?.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    if (!['ongoing', 'active', 'pending'].includes(session.status)) {
      return res.status(400).json({ msg: 'Session cannot be ended' });
    }

>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
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
<<<<<<< HEAD
      if (req.user.id === session.instructor._id.toString()) {
=======
      if (req.user.id === session.instructor.toString()) {
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
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

<<<<<<< HEAD
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

=======
    await session.save();

    // Token Economy (v3): Automatic settlement when session completes
    console.log(`[SessionEnd] Session ${session._id}:`, {
      status: session.status,
      tokensProcessed: session.tokensProcessed,
      duration: session.duration,
      instructor: session.instructor,
      learner: session.learner
    });

    try {
      if (session.status === 'completed' && !session.tokensProcessed) {
        console.log(`[SessionEnd] Triggering token settlement for session ${session._id}`);
        const MIN_DURATION_MINUTES = 5; // Minimum session duration for token award
        await tokenService.processSessionTokens(session._id, MIN_DURATION_MINUTES);
        console.log(`[SessionEnd] Token settlement completed for session ${session._id}`);
      } else {
        console.log(`[SessionEnd] Token settlement skipped - status check failed. Status: ${session.status}, tokensProcessed: ${session.tokensProcessed}`);
      }
    } catch (tokenErr) {
      console.error(`[SessionEnd] Token processing error for session ${session._id}:`, tokenErr.message);
      console.error('[SessionEnd] Full error:', tokenErr);
      // Non-blocking: do not fail the session end response
    }

>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
    // Rating system (v1): apply feedback rating to the OTHER user
    try {
      const r = typeof feedback?.rating === 'number' ? feedback.rating : null;
      if (r && r >= 1 && r <= 5) {
<<<<<<< HEAD
        const isInstructorSubmitting = req.user.id === session.instructor._id.toString();
        const targetUserId = isInstructorSubmitting ? session.learner._id : session.instructor._id;
=======
        const isInstructorSubmitting = req.user.id === session.instructor.toString();
        const targetUserId = isInstructorSubmitting ? session.learner : session.instructor;
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
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

<<<<<<< HEAD
    res.json({
      success: true,
      message: 'Session ended successfully',
      barterDetails: session.barterSystem
=======
    // Legacy v1 token system deprecated - replaced by automatic v3 settlement above
    // If v3 processing doesn't complete (e.g. duration too short), no fallback token exchange occurs

    try {
      const io = getIO();
      io?.to(req.params.id).emit('session-ended', { sessionId: req.params.id });
    } catch {
      // ignore
    }

    console.log(`[SessionEnd] Final session state before response:`, {
      statusFromDb: session.status,
      tokensProcessed: session.tokensProcessed,
      tokensExchanged: session.tokensExchanged,
      duration: session.duration
    });

    res.json({
      success: true,
      message: 'Session ended successfully',
      sessionId: req.params.id,
      status: session.status,
      tokensProcessed: session.tokensProcessed,
      tokensExchanged: session.tokensExchanged
>>>>>>> c48c849cba07a5bb33088cacfb4fde688b8a5a57
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

