import React, { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { authAPI } from '../services/api';

const Profile = () => {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [profile, setProfile] = useState({
		skillsOffer: [],
		skillsLearn: [],
		availability: 'Evenings',
		bio: '',
		level: 'Intermediate'
	});

	useEffect(() => {
		(async () => {
			try {
				const p = await authAPI.getProfile();
				setProfile({
					skillsOffer: p.skillsOffer || [],
					skillsLearn: p.skillsLearn || [],
					availability: p.availability || 'Evenings',
					bio: p.bio || '',
					level: p.level || 'Intermediate'
				});
			} catch (e) {
				// profile might not exist yet
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError('');
		try {
			const payload = {
				skillsOffer: (profile.skillsOffer || []).map(s => s.trim()).filter(Boolean),
				skillsLearn: (profile.skillsLearn || []).map(s => s.trim()).filter(Boolean),
				availability: profile.availability,
				bio: profile.bio,
				level: profile.level
			};
			await authAPI.updateProfile(payload);
		} catch (e) {
			setError(e.message);
		} finally {
			setSaving(false);
		}
	};

	const csvToArray = (v) => v.split(',').map(s => s.trim()).filter(Boolean);
	const arrayToCsv = (arr) => (arr || []).join(', ');

	return (
		<div className="min-h-screen pt-16">
			<Navigation />
			<div className="max-w-3xl mx-auto px-4 py-8">
				<h1 className="text-2xl font-bold mb-6">Your Profile</h1>
				{loading ? (
					<div>Loading...</div>
				) : (
					<form onSubmit={handleSave} className="space-y-4">
						{error && <div className="text-red-400">{error}</div>}
						<div>
							<label className="block mb-2 text-sm text-gray-300">Skills you can teach (comma-separated)</label>
							<input className="w-full px-3 py-2 rounded bg-slate-800 border border-purple-500/20"
								value={arrayToCsv(profile.skillsOffer)}
								onChange={(e) => setProfile({ ...profile, skillsOffer: csvToArray(e.target.value) })}
							/>
						</div>
						<div>
							<label className="block mb-2 text-sm text-gray-300">Skills you want to learn (comma-separated)</label>
							<input className="w-full px-3 py-2 rounded bg-slate-800 border border-purple-500/20"
								value={arrayToCsv(profile.skillsLearn)}
								onChange={(e) => setProfile({ ...profile, skillsLearn: csvToArray(e.target.value) })}
							/>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block mb-2 text-sm text-gray-300">Availability</label>
								<select className="w-full px-3 py-2 rounded bg-slate-800 border border-purple-500/20"
									value={profile.availability}
									onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
								>
									<option>Morning</option>
									<option>Afternoon</option>
									<option>Evenings</option>
									<option>Weekends</option>
									<option>Flexible</option>
								</select>
							</div>
							<div>
								<label className="block mb-2 text-sm text-gray-300">Level</label>
								<select className="w-full px-3 py-2 rounded bg-slate-800 border border-purple-500/20"
									value={profile.level}
									onChange={(e) => setProfile({ ...profile, level: e.target.value })}
								>
									<option>Beginner</option>
									<option>Intermediate</option>
									<option>Advanced</option>
									<option>Expert</option>
								</select>
							</div>
						</div>
						<div>
							<label className="block mb-2 text-sm text-gray-300">Bio</label>
							<textarea className="w-full px-3 py-2 rounded bg-slate-800 border border-purple-500/20" rows={4}
								value={profile.bio}
								onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
							/>
						</div>
						<button disabled={saving} className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded font-medium">
							{saving ? 'Saving...' : 'Save Profile'}
						</button>
					</form>
				)}
			</div>
		</div>
	);
};

export default Profile;
