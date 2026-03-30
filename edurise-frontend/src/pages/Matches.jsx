import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { authAPI, connectionAPI } from '../services/api';

const Matches = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [matches, setMatches] = useState([]);
	const [requesting, setRequesting] = useState({});

	useEffect(() => {
		(async () => {
			try {
				// Prefer AI recommendations endpoint when available; fallback to legacy matches.
				const rec = await authAPI.getRecommendations().catch(() => null);
				if (rec?.success && Array.isArray(rec.recommendations)) {
					setMatches(rec.recommendations);
				} else {
					const data = await authAPI.getMatches();
					setMatches(data);
				}
			} catch (e) {
				setError(e.message);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const handleConnect = async (userId) => {
		const prev = matches.find((m) => String(m.userId) === String(userId));
		const prevStatus = prev?.connectionStatus || 'none';

		setRequesting((p) => ({ ...p, [userId]: true }));
		setError('');

		// Optimistic update: show "Requested" immediately.
		setMatches((prevMatches) =>
			prevMatches.map((m) =>
				String(m.userId) === String(userId)
					? { ...m, connectionStatus: 'pending' }
					: m
			)
		);

		try {
			await connectionAPI.request(userId);
		} catch (e) {
			setError(e.message);

			// Revert if request failed.
			setMatches((prevMatches) =>
				prevMatches.map((m) =>
					String(m.userId) === String(userId)
						? { ...m, connectionStatus: prevStatus }
						: m
				)
			);
		} finally {
			setRequesting((p) => ({ ...p, [userId]: false }));
		}
	};

	const handleRemove = async (userId) => {
		const prev = matches.find((m) => String(m.userId) === String(userId));

		setRequesting((p) => ({ ...p, [userId]: true }));
		setError('');

		// Optimistic update: show "Connect" immediately.
		setMatches((prevMatches) =>
			prevMatches.map((m) =>
				String(m.userId) === String(userId)
					? { ...m, connectionStatus: 'none' }
					: m
			)
		);

		try {
			await connectionAPI.remove(userId);
		} catch (e) {
			setError(e.message);

			// Revert if remove failed.
			setMatches((prevMatches) =>
				prevMatches.map((m) =>
					String(m.userId) === String(userId)
						? { ...m, connectionStatus: 'accepted' }
						: m
				)
			);
		} finally {
			setRequesting((p) => ({ ...p, [userId]: false }));
		}
	};

	return (
		<div className="min-h-screen pt-16">
			<Navigation />
			<div className="max-w-4xl mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold mb-2">Recommended Matches</h1>
				<p className="text-gray-400 text-sm mb-6">
					After you connect, open your <Link to="/dashboard" className="text-purple-300 underline">dashboard</Link> to start a video session.
				</p>
				{loading ? (
					<div>Loading...</div>
				) : error ? (
					<div className="text-red-400">{error}</div>
				) : matches.length === 0 ? (
					<div>No matches yet. Make sure your profile is filled out.</div>
				) : (
					<div className="space-y-4">
						{matches.map((m) => (
							<div key={m.userId} className="p-4 bg-slate-800 border border-purple-500/20 rounded">
								<div className="flex items-center justify-between">
									<div>
										<div className="font-semibold">{m.name}</div>
										<div className="text-sm text-gray-400">Score: {m.score}</div>
									</div>
									{m.scores?.overall !== undefined && (
										<div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
											{m.scores.overall}% match
										</div>
									)}
									<div className="text-sm text-gray-300">
										<span className="mr-2">Offers: {m.skillsOffer.join(', ')}</span>
										<span>Wants: {m.skillsLearn.join(', ')}</span>
									</div>
									<div className="ml-4 flex gap-2">
										{m.connectionStatus === 'accepted' ? (
											<>
												<Link
													to="/dashboard"
													className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white inline-block"
												>
													Start Learning
												</Link>
												<button
													onClick={() => handleRemove(m.userId)}
													disabled={!!requesting[m.userId]}
													title="Remove this connection (you can reconnect anytime)"
													className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white"
												>
													{requesting[m.userId] ? 'Removing...' : 'Remove'}
												</button>
											</>
										) : m.connectionStatus === 'pending' ? (
											<button
												type="button"
												disabled
												title="Request sent. Waiting for the other user to accept."
												className="px-3 py-2 rounded bg-gray-500 text-white cursor-not-allowed opacity-80"
											>
												Pending
											</button>
										) : (
											<button
												onClick={() => handleConnect(m.userId)}
												disabled={!!requesting[m.userId]}
												className="px-3 py-2 rounded bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50 text-white"
											>
												{requesting[m.userId] ? 'Sending...' : 'Connect'}
											</button>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default Matches;


