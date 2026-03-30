import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import {
  authAPI,
  connectionAPI,
  notificationAPI,
  sessionAPI,
  tddsAPI,
  getCurrentUser
} from '../services/api';
import { onNotification } from '../services/socket';
import { getRelativeTime, formatNotificationMessage, formatScoreAsPercentage } from '../utils/timeFormat';

const Dashboard = () => {
  const navigate = useNavigate();
  const me = getCurrentUser();
  const myId = me?.id ? String(me.id) : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connData, setConnData] = useState({
    incomingPending: [],
    outgoingPending: [],
    accepted: []
  });
  const [activeSessions, setActiveSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [tddsSummary, setTddsSummary] = useState(null);
  const [tddsHistory, setTddsHistory] = useState([]);
  const [startingPeerId, setStartingPeerId] = useState(null);
  const [connectBusy, setConnectBusy] = useState({});

  const loadConnections = useCallback(async () => {
    const res = await connectionAPI.getMine();
    setConnData(res);
  }, []);

  const loadSessions = useCallback(async () => {
    const list = await sessionAPI.getActive();
    setActiveSessions(Array.isArray(list) ? list : []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadConnections(), loadSessions()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [loadConnections, loadSessions]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    (async () => {
      try {
        const initial = await notificationAPI.listMine(20);
        setNotifications(initial);
      } catch {
        // ignore
      }
      try {
        const summary = await tddsAPI.me();
        setTddsSummary(summary);
      } catch {
        // ignore
      }
      try {
        const hist = await tddsAPI.history(10);
        setTddsHistory(Array.isArray(hist) ? hist : []);
      } catch {
        // ignore
      }

      setMatchesLoading(true);
      try {
        const m = await authAPI.getMatches();
        setMatches(Array.isArray(m) ? m : []);
      } catch {
        setMatches([]);
      } finally {
        setMatchesLoading(false);
      }
    })();

    const unsub = onNotification((n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 20));
      if (
        n?.type === 'connection_request' ||
        n?.type === 'connection_accepted' ||
        n?.type === 'connection_rejected' ||
        n?.type === 'session_invite'
      ) {
        loadConnections();
        loadSessions();
      }
    });
    return () => unsub();
  }, [loadConnections, loadSessions]);

  const peerFromConnection = (c) => {
    const a = c.from?._id ?? c.from;
    const b = c.to?._id ?? c.to;
    const aid = a?.toString?.() ?? String(a);
    const bid = b?.toString?.() ?? String(b);
    if (!myId) return { user: c.to, id: bid };
    return aid === myId ? { user: c.to, id: bid } : { user: c.from, id: aid };
  };

  const hasLiveSessionWithPeer = (peerId) => {
    const pid = String(peerId);
    return activeSessions.some((s) => {
      const ins = s.instructor?._id ?? s.instructor;
      const ler = s.learner?._id ?? s.learner;
      const pair = [String(ins), String(ler)];
      return pair.includes(pid) && pair.includes(myId);
    });
  };

  /** Block starting a second session when already in one with someone else. */
  const cannotStartAnotherSession = (peerId) =>
    activeSessions.length > 0 && !hasLiveSessionWithPeer(peerId);

  const accept = async (id) => {
    await connectionAPI.accept(id);
    await loadConnections();
  };
  const reject = async (id) => {
    await connectionAPI.reject(id);
    await loadConnections();
  };

  const sendMatchConnect = async (userId) => {
    setConnectBusy((p) => ({ ...p, [userId]: true }));
    setError('');
    try {
      await connectionAPI.request(userId);
      await loadConnections();
    } catch (e) {
      setError(e.message);
    } finally {
      setConnectBusy((p) => ({ ...p, [userId]: false }));
    }
  };

  const startSessionWithPeer = async (peerId, topic = 'General') => {
    setStartingPeerId(peerId);
    setError('');
    try {
      const res = await sessionAPI.startWithPeer({
        peerUserId: peerId,
        topic,
        skill: { name: topic, category: 'General', level: 'beginner' }
      });
      await loadSessions();
      const sid = res.sessionId || res.session?._id;
      if (sid) {
        navigate(`/session/${sid}`, {
          state: {
            sessionData: res.session,
            userRole: 'instructor'
          }
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setStartingPeerId(null);
    }
  };

  const openSessionRoom = async (sessionId) => {
    try {
      await sessionAPI.join(sessionId);
      await loadSessions();
      const s = await sessionAPI.getById(sessionId);
      const myRole =
        String(s?.instructor?._id ?? s?.instructor) === myId
          ? 'instructor'
          : 'learner';
      navigate(`/session/${sessionId}`, {
        state: { sessionData: s, userRole: myRole }
      });
    } catch (e) {
      setError(e.message);
    }
  };

  const pendingIncoming = connData.incomingPending || [];
  const pendingOutgoing = connData.outgoingPending || [];
  const accepted = connData.accepted || [];

  return (
    <div className="min-h-screen pt-16">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400 hidden sm:block">
            Connections, matches, and sessions in one place
          </p>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        {tddsSummary && (
          <div className="p-4 bg-slate-800 border border-purple-500/20 rounded-lg">
            <h2 className="font-semibold mb-2">TDDS</h2>
            <div className="text-sm text-gray-300 flex flex-wrap gap-6">
              <div>
                <span className="text-gray-400">Distraction score:</span>{' '}
                <span className="font-medium">{formatScoreAsPercentage(tddsSummary.distractionScore)}</span>
              </div>
              <div>
                <span className="text-gray-400">Avg relevance:</span>{' '}
                <span className="font-medium">{tddsSummary.avgRelevance ? formatScoreAsPercentage(tddsSummary.avgRelevance) : 'N/A'}</span>
              </div>
            </div>
            {tddsHistory.length > 0 && (
              <div className="mt-3 text-sm text-gray-300">
                <div className="text-gray-400 mb-2">Recent checks</div>
                <div className="space-y-1">
                  {tddsHistory.slice(0, 3).map((h) => (
                    <div
                      key={h._id}
                      className="bg-slate-900 rounded p-2 flex items-center justify-between"
                    >
                      <span className="truncate pr-2">{h.topic}</span>
                      <span className="text-gray-400 whitespace-nowrap">
                        {Math.round((h.relevanceScore || 0) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="p-4 bg-slate-800 border border-purple-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Notifications</h2>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await notificationAPI.markAllRead();
                  } catch {
                    // ignore
                  }
                  setNotifications([]);
                }}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 6).map((n, idx) => (
                <div key={idx} className="text-sm text-gray-300 bg-slate-900 rounded p-3">
                  <div className="text-gray-100 mb-1">{formatNotificationMessage(n)}</div>
                  <div className="text-xs text-gray-500">{getRelativeTime(n.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sessions */}
        <section className="p-4 bg-slate-800 border border-purple-500/20 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Upcoming &amp; live sessions</h2>
            <button
              type="button"
              onClick={() => navigate('/sessions')}
              className="text-sm text-purple-300 hover:text-purple-200"
            >
              Full history
            </button>
          </div>
          {activeSessions.length === 0 ? (
            <p className="text-gray-400 text-sm">No pending or live sessions.</p>
          ) : (
            <div className="space-y-2">
              {activeSessions.map((s) => {
                const ins = s.instructor?._id ?? s.instructor;
                const isInstructor = String(ins) === myId;
                return (
                  <div
                    key={s._id}
                    className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 rounded-lg p-3"
                  >
                    <div>
                      <div className="font-medium">{s.skill?.name || s.topic}</div>
                      <div className="text-xs text-gray-400 capitalize">
                        {s.status === 'ongoing' ? 'live' : s.status} · {s.sessionType}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSessionRoom(s._id)}
                      className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium"
                    >
                      {isInstructor ? 'Open / Start' : 'Join'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pending + Matches */}
        <div className="grid md:grid-cols-2 gap-6">
          <section className="p-4 bg-slate-800 border border-purple-500/20 rounded-lg space-y-3">
            <h2 className="font-semibold">Connection requests</h2>
            {loading ? (
              <div className="text-gray-400 text-sm">Loading…</div>
            ) : (
              <>
                <div>
                  <h3 className="text-xs uppercase text-gray-500 mb-2">Incoming</h3>
                  {pendingIncoming.length === 0 ? (
                    <p className="text-gray-400 text-sm">None</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingIncoming.map((r) => (
                        <div
                          key={r._id}
                          className="flex items-center justify-between gap-2 bg-slate-900 rounded p-2"
                        >
                          <div>
                            <div className="font-medium text-sm">{r.from?.name}</div>
                            <div className="text-xs text-gray-500">{r.from?.email}</div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => accept(r._id)}
                              className="px-2 py-1 rounded bg-purple-600 text-xs"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => reject(r._id)}
                              className="px-2 py-1 rounded bg-pink-700 text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xs uppercase text-gray-500 mb-2 mt-4">Outgoing</h3>
                  {pendingOutgoing.length === 0 ? (
                    <p className="text-gray-400 text-sm">None</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingOutgoing.map((r) => (
                        <div key={r._id} className="bg-slate-900 rounded p-2 text-sm">
                          <span className="font-medium">{r.to?.name}</span>
                          <span className="text-gray-500 ml-2">({r.status})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>

          <section className="p-4 bg-slate-800 border border-purple-500/20 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recommended matches</h2>
              <button
                type="button"
                onClick={() => navigate('/matches')}
                className="text-sm text-purple-300 hover:text-purple-200"
              >
                See all
              </button>
            </div>
            {matchesLoading ? (
              <div className="text-gray-400 text-sm">Loading…</div>
            ) : matches.length === 0 ? (
              <p className="text-gray-400 text-sm">
                Complete your profile to get matches.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {matches.slice(0, 5).map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between gap-2 bg-slate-900 rounded p-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{m.name}</div>
                      <div className="text-xs text-gray-500">Score {m.score}</div>
                    </div>
                    <button
                      type="button"
                      disabled={!!connectBusy[m.userId]}
                      onClick={() => sendMatchConnect(m.userId)}
                      className="shrink-0 px-3 py-1 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-xs disabled:opacity-50"
                    >
                      {connectBusy[m.userId] ? '…' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Connections + Start session */}
        <section className="p-4 bg-slate-800 border border-purple-500/20 rounded-lg space-y-3">
          <h2 className="font-semibold">Your connections</h2>
          {loading ? (
            <div className="text-gray-400 text-sm">Loading…</div>
          ) : accepted.length === 0 ? (
            <p className="text-gray-400 text-sm">
              Connect with someone from matches to start a session here.
            </p>
          ) : (
            <div className="space-y-3">
              {accepted.map((c) => {
                const { user: peer, id: peerId } = peerFromConnection(c);
                const busy = startingPeerId === peerId;
                const blocked =
                  hasLiveSessionWithPeer(peerId) || cannotStartAnotherSession(peerId);
                return (
                  <div
                    key={c._id}
                    className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 rounded-lg p-3"
                  >
                    <div>
                      <div className="font-medium">{peer?.name || 'Peer'}</div>
                      <div className="text-xs text-gray-500">{peer?.email}</div>
                    </div>
                    <button
                      type="button"
                      disabled={busy || blocked}
                      onClick={() => {
                        const topic =
                          window.prompt('Session topic (optional)', 'General') ||
                          'General';
                        startSessionWithPeer(peerId, topic);
                      }}
                      className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium disabled:opacity-40"
                      title={
                        blocked
                          ? 'Open the session from the list above, or finish your other session first'
                          : ''
                      }
                    >
                      {busy ? 'Starting…' : 'Start session'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
