import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { sessionAPI } from '../services/api';

const Sessions = () => {
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState('');
	const [active, setActive] = useState([]);
	const [history, setHistory] = useState([]);
	const [form, setForm] = useState({
		skillName: '',
		skillCategory: '',
		skillLevel: 'beginner',
		sessionType: 'video',
		scheduledDuration: 60
	});

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

	const createSession = async (e) => {
		e.preventDefault();
		setCreating(true);
		setError('');
		try {
			await sessionAPI.create({
				skill: { name: form.skillName, category: form.skillCategory, level: form.skillLevel },
				sessionType: form.sessionType,
				scheduledDuration: Number(form.scheduledDuration)
			});
			setForm({ skillName: '', skillCategory: '', skillLevel: 'beginner', sessionType: 'video', scheduledDuration: 60 });
			await load();
		} catch (e) {
			setError(e.message);
		} finally {
			setCreating(false);
		}
	};

	const join = async (id) => { await sessionAPI.join(id); await load(); };
	const end = async (id) => { await sessionAPI.end(id); await load(); };

	return (
		<div className="min-h-screen pt-16">
			<Navigation />
			<div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
				<h1 className="text-2xl font-bold">Sessions</h1>
				{error && <div className="text-red-400">{error}</div>}

				{/* Create session */}
				<div className="p-4 bg-slate-800 border border-purple-500/20 rounded">
					<h2 className="font-semibold mb-4">Create Session</h2>
					<form onSubmit={createSession} className="grid grid-cols-1 md:grid-cols-5 gap-3">
						<input placeholder="Skill name" className="px-3 py-2 rounded bg-slate-900 border border-purple-500/20" value={form.skillName} onChange={(e) => setForm({ ...form, skillName: e.target.value })} />
						<input placeholder="Category" className="px-3 py-2 rounded bg-slate-900 border border-purple-500/20" value={form.skillCategory} onChange={(e) => setForm({ ...form, skillCategory: e.target.value })} />
						<select className="px-3 py-2 rounded bg-slate-900 border border-purple-500/20" value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}>
							<option value="beginner">beginner</option>
							<option value="intermediate">intermediate</option>
							<option value="advanced">advanced</option>
						</select>
						<select className="px-3 py-2 rounded bg-slate-900 border border-purple-500/20" value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value })}>
							<option value="video">video</option>
							<option value="audio">audio</option>
							<option value="chat">chat</option>
						</select>
						<input type="number" min="15" step="15" className="px-3 py-2 rounded bg-slate-900 border border-purple-500/20" value={form.scheduledDuration} onChange={(e) => setForm({ ...form, scheduledDuration: e.target.value })} />
						<button disabled={creating} className="md:col-span-5 bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded font-medium">
							{creating ? 'Creating...' : 'Create'}
						</button>
					</form>
				</div>

				{/* Active sessions */}
				<div className="p-4 bg-slate-800 border border-purple-500/20 rounded">
					<h2 className="font-semibold mb-4">Active/Pending</h2>
					{active.length === 0 ? (
						<div className="text-gray-400">No active sessions</div>
					) : (
						<div className="space-y-3">
							{active.map(s => (
								<div key={s._id} className="flex items-center justify-between bg-slate-900 rounded p-3">
									<div>
										<div className="font-semibold">{s.skill?.name} • {s.sessionType} • {s.status}</div>
										<div className="text-sm text-gray-400">Scheduled {s.duration?.scheduled} min</div>
									</div>
									<div className="space-x-2">
										<button onClick={() => join(s._id)} className="px-3 py-1 rounded bg-purple-600">Join</button>
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
