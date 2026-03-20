import React, { useEffect, useState } from 'react';
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
				const data = await authAPI.getMatches();
				setMatches(data);
			} catch (e) {
				setError(e.message);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const sendRequest = async (userId) => {
		setRequesting((p) => ({ ...p, [userId]: true }));
		setError('');
		try {
			await connectionAPI.request(userId);
		} catch (e) {
			setError(e.message);
		} finally {
			setRequesting((p) => ({ ...p, [userId]: false }));
		}
	};

	return (
		<div className="min-h-screen pt-16">
			<Navigation />
			<div className="max-w-4xl mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold mb-6">Recommended Matches</h1>
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
									<div className="text-sm text-gray-300">
										<span className="mr-2">Offers: {m.skillsOffer.join(', ')}</span>
										<span>Wants: {m.skillsLearn.join(', ')}</span>
									</div>
									<div className="ml-4">
										<button
											onClick={() => sendRequest(m.userId)}
											disabled={!!requesting[m.userId]}
											className="px-3 py-2 rounded bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50"
										>
											{requesting[m.userId] ? 'Sending...' : 'Connect'}
										</button>
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


