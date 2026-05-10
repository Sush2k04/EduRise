import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';
import { onSessionInvite } from '../services/socket';

function playInviteChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.start();
    o.stop(ctx.currentTime + 0.12);
  } catch {
    // ignore
  }
}

const SessionInviteListener = () => {
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    const me = getCurrentUser();
    if (!me?.id) return undefined;
    const unsub = onSessionInvite((payload) => {
      const sid = payload?.sessionId;
      if (!sid) return;
      playInviteChime();
      setInvite({
        sessionId: sid,
        fromName: payload?.session?.instructor?.name || 'Someone'
      });
    });
    return () => unsub();
  }, []);

  if (!invite) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-[calc(100%-2rem)] rounded-xl border border-purple-500/40 bg-slate-900/95 backdrop-blur-md p-4 shadow-2xl">
      <div className="text-sm font-semibold text-white">Session invitation</div>
      <div className="text-sm text-gray-300 mt-1">
        {invite.fromName} started a learning session with you.
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            navigate(`/session/${invite.sessionId}`);
            setInvite(null);
          }}
          className="flex-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-sm font-medium"
        >
          Join
        </button>
        <button
          type="button"
          onClick={() => setInvite(null)}
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-gray-300"
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default SessionInviteListener;
