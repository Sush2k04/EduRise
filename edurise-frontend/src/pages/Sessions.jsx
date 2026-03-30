import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { sessionAPI } from '../services/api';
import { getCurrentUser } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Sessions = () => {
	const navigate = useNavigate();
	const [error, setError] = useState('');
	const [active, setActive] = useState([]);
	const [history, setHistory] = useState([]);

	const load = async () => {
		try {
			setError('');
			const [a, h] = await Promise.all([
				sessionAPI.getActive(),
				sessionAPI.getHistory()
			]);
			setActive(a);
			setHistory(h);
		} catch (e) {
			setError(e.message);
		}
	};

	useEffect(() => {
		load();
	}, []);

	const join = async (id) => {
		try {
			setError('');
			await sessionAPI.join(id);
			const s = await sessionAPI.getById(id).catch(() => null);
			await load();
			// Open the call UI
			navigate(`/session/${id}`, { state: { sessionData: s || { skill: 'Peer Learning' }, userRole: 'learner' } });
		} catch (e) {
			setError(e.message);
		}
	};
	const end = async (id) => { await sessionAPI.end(id); await load(); };
	const me = getCurrentUser();
	const myId = me?.id;

	return (
		<div className="min-h-screen pt-16">
			<Navigation />
			<div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
				<h1 className="text-2xl font-bold">Sessions</h1>
				<p className="text-gray-400 text-sm mt-2">
					Start a new session from the <button type="button" onClick={() => navigate('/dashboard')} className="text-purple-300 underline">dashboard</button> with a connected peer.
				</p>
				{error && <div className="text-red-400">{error}</div>}

				{/* Active sessions */}
				<div className="p-4 bg-slate-800 border border-purple-500/20 rounded">
					<h2 className="font-semibold mb-4">Pending / live</h2>
					{active.length === 0 ? (
						<div className="text-gray-400">No active sessions</div>
					) : (
						<div className="space-y-3">
							{active.map(s => (
								<div key={s._id} className="flex items-center justify-between bg-slate-900 rounded p-3">
									<div>
										<div className="font-semibold">{s.skill?.name} • {s.sessionType} • {s.status === 'ongoing' ? 'live' : s.status}</div>
										<div className="text-sm text-gray-400">Scheduled {s.duration?.scheduled} min</div>
									</div>
									<div className="space-x-2">
											<button onClick={() => join(s._id)} className="px-3 py-1 rounded bg-purple-600">
												{s.instructor?._id === myId ? 'Start' : 'Join'}
											</button>
										<button onClick={() => end(s._id)} className="px-3 py-1 rounded bg-pink-600">End</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* History */}
				<div className="p-4 bg-slate-800 border border-purple-500/20 rounded">
					<h2 className="font-semibold mb-4">History</h2>
					{history.length === 0 ? (
						<div className="text-gray-400">No completed sessions</div>
					) : (
						<div className="space-y-3">
							{history.map(s => (
								<div key={s._id} className="bg-slate-900 rounded p-3">
									<div className="font-semibold">{s.skill?.name} • {s.sessionType} • completed</div>
									<div className="text-sm text-gray-400">Ended {new Date(s.endTime).toLocaleString()}</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Sessions;


