import Session, { LIVE_SESSION_STATUSES } from '../models/Session.js';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import Notification from '../models/Notification.js';
import { getIO } from '../sockets/io.js';
import tokenService from '../services/tokenService.js';

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
      status: { $in: LIVE_SESSION_STATUSES }
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

    if (!LIVE_SESSION_STATUSES.includes(session.status)) {
      return res.status(400).json({ msg: 'Session is not available' });
    }

    const isInstructor = session.instructor.toString() === req.user.id;

    if (!isInstructor) {
      if (session.learner && session.learner.toString() !== req.user.id) {
        return res.status(400).json({ msg: 'Session already has a learner' });
      }
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

    await session.save();

    try {
      await User.updateMany(
        {
          _id: {
            $in: [session.instructor, session.learner].filter(Boolean)
          }
        },
        { $addToSet: { sessionHistory: session._id } }
      );
    } catch {
      // ignore
    }

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

    if (!['ongoing', 'active', 'pending'].includes(session.status)) {
      return res.status(400).json({ msg: 'Session cannot be ended' });
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

