import io from 'socket.io-client';
import { getCurrentUser } from './api';

let socket = null;

function normalizeSocketUrl(rawApiOrSocket) {
  const fallback = 'http://localhost:5001';
  if (!rawApiOrSocket) return fallback;
  // If given ".../api", strip it for socket base
  return rawApiOrSocket.replace(/\/api\/?$/, '');
}

export function getSocket() {
  if (socket) return socket;
  socket = io(normalizeSocketUrl(import.meta.env.VITE_API_URL));

  const user = getCurrentUser();
  if (user?.id) {
    socket.emit('register-user', {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      skills: user.skillsToTeach || [],
      tokens: user.tokens
    });
  }

  return socket;
}

export function onNotification(handler) {
  const s = getSocket();
  s.on('notification', handler);
  return () => s.off('notification', handler);
}

export function onSessionInvite(handler) {
  const s = getSocket();
  s.on('session-invite', handler);
  return () => s.off('session-invite', handler);
}

export function onSessionStarted(handler) {
  const s = getSocket();
  s.on('session-started', handler);
  return () => s.off('session-started', handler);
}

