import mongoose from 'mongoose';
import Session from '../models/Session.js';

// In-memory presence map (socket.id -> userInfo)
// For a production setup, switch to Redis + adapter for multi-instance.
const socketUsers = new Map();

function emitActiveUsers(io) {
  const users = Array.from(socketUsers.values());
  io.emit('active-users-updated', users);
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('register-user', (userInfo) => {
      const userId = userInfo?.id;
      if (userId) {
        socket.join(`user:${userId}`);
      }
      socketUsers.set(socket.id, {
        id: userInfo?.id || socket.id,
        name: userInfo?.name || 'Anonymous',
        avatar: userInfo?.avatar || '',
        skills: userInfo?.skills || [],
        tokens: userInfo?.tokens,
        isOnline: true
      });
      emitActiveUsers(io);
    });

    socket.on('join-session', async ({ sessionId, userInfo } = {}) => {
      if (!sessionId) return;
      socket.join(sessionId);
      io.to(sessionId).emit('user-joined-session', { sessionId, userInfo });

      try {
        const sockets = await io.in(sessionId).allSockets();
        socket.emit('session-joined', { sessionId, participants: sockets.size });
      } catch {
        socket.emit('session-joined', { sessionId, participants: 1 });
      }

      try {
        const session = await Session.findById(sessionId)
          .populate('chatMessages.sender', 'name')
          .lean();
        if (session) {
          socket.emit('session-data', {
            sessionId,
            chatMessages: (session.chatMessages || []).map((m) => ({
              sender: {
                id: m?.sender?._id?.toString?.() || m?.sender?.toString?.() || '',
                name: m?.sender?.name || 'Unknown'
              },
              message: m.message,
              timestamp: m.timestamp
            })),
            notes: session.notes || [],
            feedback: session.feedback || {}
          });
        }
      } catch {
        // ignore: session might not exist yet (UI mock sessions)
      }
    });

    socket.on('send-chat-message', async (payload = {}) => {
      const { sessionId, message, sender } = payload;
      if (!sessionId || !message || !sender) return;

      const msg = {
        sender: { id: sender.id, name: sender.name },
        message,
        timestamp: new Date()
      };

      io.to(sessionId).emit('new-chat-message', msg);

      // Best-effort persistence when session exists in DB
      try {
        const session = await Session.findById(sessionId);
        if (session) {
          if (mongoose.isValidObjectId(sender.id)) {
            session.chatMessages.push({
              sender: sender.id,
              message,
              timestamp: msg.timestamp
            });
          }
          await session.save();
        }
      } catch {
        // ignore
      }
    });

    socket.on('submit-feedback', async ({ sessionId, feedback, reviewer } = {}) => {
      if (!sessionId || !feedback) return;
      io.to(sessionId).emit('feedback-submitted', { sessionId, feedback, reviewer });

      try {
        const session = await Session.findById(sessionId);
        if (session) {
          // Store as learnerFeedback by default; API route will do role-specific updates
          session.feedback.learnerFeedback = {
            rating: feedback.rating,
            comment: feedback.comment,
            submittedAt: new Date()
          };
          await session.save();
        }
      } catch {
        // ignore
      }
    });

    // WebRTC signaling passthrough
    socket.on('webrtc-offer', ({ sessionId, offer } = {}) => {
      if (!sessionId || !offer) return;
      socket.to(sessionId).emit('webrtc-offer', { offer, from: socket.id });
    });

    socket.on('webrtc-answer', ({ sessionId, answer } = {}) => {
      if (!sessionId || !answer) return;
      socket.to(sessionId).emit('webrtc-answer', { answer, from: socket.id });
    });

    socket.on('webrtc-ice-candidate', ({ sessionId, candidate } = {}) => {
      if (!sessionId || !candidate) return;
      socket.to(sessionId).emit('webrtc-ice-candidate', { candidate, from: socket.id });
    });

    socket.on('end-session', ({ sessionId } = {}) => {
      if (!sessionId) return;
      io.to(sessionId).emit('session-ended', { sessionId });
    });

    socket.on('disconnect', () => {
      socketUsers.delete(socket.id);
      emitActiveUsers(io);
    });
  });
}

