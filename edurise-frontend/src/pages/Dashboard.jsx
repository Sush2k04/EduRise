import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import Sessions from './Sessions';
import { connectionAPI, notificationAPI, tddsAPI } from '../services/api';
import { onNotification } from '../services/socket';

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
    }`}
  >
    {children}
  </button>
);

const Dashboard = () => {
  const [tab, setTab] = useState('connections'); // connections | pending | sessions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({ incomingPending: [], outgoingPending: [], accepted: [] });
  const [notifications, setNotifications] = useState([]);
  const [tddsSummary, setTddsSummary] = useState(null);
  const [tddsHistory, setTddsHistory] = useState([]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await connectionAPI.getMine();
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
    })();

    const unsub = onNotification((n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 20));
      // Keep dashboard data fresh when requests update
      if (
        n?.type === 'connection_request' ||
        n?.type === 'connection_accepted' ||
        n?.type === 'connection_rejected'
      ) {
        load();
      }
    });
    return () => unsub();
  }, []);

  const pendingIncoming = data.incomingPending || [];
  const pendingOutgoing = data.outgoingPending || [];
  const acceptedPeers = (data.accepted || []).map((c) => ({
    id: c._id,
    from: c.from,
    to: c.to,
    createdAt: c.createdAt
  }));

  const accept = async (id) => {
    await connectionAPI.accept(id);
    await load();
  };
  const reject = async (id) => {
    await connectionAPI.reject(id);
    await load();
  };

  return (
    <div className="min-h-screen pt-16">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {tddsSummary && (
          <div className="p-4 bg-slate-800 border border-purple-500/20 rounded">
            <h2 className="font-semibold mb-2">TDDS (Topic Distraction Detection)</h2>
            <div className="text-sm text-gray-300 flex flex-wrap gap-6">
              <div>
                <span className="text-gray-400">Distraction score:</span>{' '}
                <span className="font-medium">{tddsSummary.distractionScore}</span>
              </div>
              <div>
                <span className="text-gray-400">Avg relevance (last {tddsSummary.recentCount}):</span>{' '}
                <span className="font-medium">{tddsSummary.avgRelevance ?? 'N/A'}</span>
              </div>
            </div>
            {tddsHistory.length > 0 && (
              <div className="mt-3 text-sm text-gray-300">
                <div className="text-gray-400 mb-2">Recent checks</div>
                <div className="space-y-1">
                  {tddsHistory.slice(0, 5).map((h) => (
                    <div key={h._id} className="bg-slate-900 rounded p-2 flex items-center justify-between">
                      <div className="truncate pr-2">
                        <span className="text-gray-400">Topic:</span> {h.topic}
                      </div>
                      <div className="text-gray-400 whitespace-nowrap">
                        rel {Math.round((h.relevanceScore || 0) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="p-4 bg-slate-800 border border-purple-500/20 rounded">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Notifications</h2>
              <button
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
              {notifications.slice(0, 5).map((n, idx) => (
                <div key={idx} className="text-sm text-gray-300 bg-slate-900 rounded p-2">
                  <span className="text-gray-400 mr-2">{n.type}</span>
                  <span className="text-gray-500">
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex gap-2">
            <TabButton active={tab === 'connections'} onClick={() => setTab('connections')}>Connections</TabButton>
            <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>Pending</TabButton>
            <TabButton active={tab === 'sessions'} onClick={() => setTab('sessions')}>Sessions</TabButton>
          </div>
        </div>

        {error && <div className="text-red-400">{error}</div>}

        {tab === 'sessions' ? (
          <Sessions />
        ) : loading ? (
          <div>Loading...</div>
        ) : tab === 'connections' ? (
          <div className="p-4 bg-slate-800 border border-purple-500/20 rounded">
            <h2 className="font-semibold mb-4">Your connections</h2>
            {acceptedPeers.length === 0 ? (
              <div className="text-gray-400">No connections yet.</div>
            ) : (
              <div className="space-y-3">
                {acceptedPeers.map((c) => (
                  <div key={c.id} className="bg-slate-900 rounded p-3 flex items-center justify-between">
                    <div className="text-sm text-gray-300">
                      <div>
                        <span className="text-gray-400">From:</span> {c.from?.name || 'Unknown'}{' '}
                        <span className="text-gray-500">({c.from?.email || ''})</span>
                      </div>
                      <div>
                        <span className="text-gray-400">To:</span> {c.to?.name || 'Unknown'}{' '}
                        <span className="text-gray-500">({c.to?.email || ''})</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-800 border border-purple-500/20 rounded">
              <h2 className="font-semibold mb-4">Incoming requests</h2>
              {pendingIncoming.length === 0 ? (
                <div className="text-gray-400">No incoming requests.</div>
              ) : (
                <div className="space-y-3">
                  {pendingIncoming.map((r) => (
                    <div key={r._id} className="bg-slate-900 rounded p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.from?.name}</div>
                        <div className="text-sm text-gray-400">{r.from?.email}</div>
                      </div>
                      <div className="space-x-2">
                        <button onClick={() => accept(r._id)} className="px-3 py-1 rounded bg-purple-600">Accept</button>
                        <button onClick={() => reject(r._id)} className="px-3 py-1 rounded bg-pink-600">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-800 border border-purple-500/20 rounded">
              <h2 className="font-semibold mb-4">Outgoing requests</h2>
              {pendingOutgoing.length === 0 ? (
                <div className="text-gray-400">No outgoing requests.</div>
              ) : (
                <div className="space-y-3">
                  {pendingOutgoing.map((r) => (
                    <div key={r._id} className="bg-slate-900 rounded p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.to?.name}</div>
                        <div className="text-sm text-gray-400">{r.to?.email}</div>
                      </div>
                      <div className="text-xs text-gray-500">{r.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

