import { useEffect, useState } from 'react';
import Navigation from '../components/Navigation';
import { tokenAPI } from '../services/api';

export default function TokenHistory() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [balRes, histRes] = await Promise.all([
          tokenAPI.getBalance(),
          tokenAPI.getHistory(20)
        ]);
        if (!mounted) return;
        setBalance(balRes);
        setTransactions(histRes.transactions || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="min-h-screen pt-16"><Navigation /><div className="p-8 text-center">Loading...</div></div>;

  return (
    <div className="min-h-screen pt-16">
      <Navigation />
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <p className="text-sm opacity-80 mb-1">Your Token Balance</p>
          <p className="text-5xl font-bold">🪙 {balance?.balance ?? 0}</p>
          <div className="flex gap-6 mt-3 text-sm opacity-90">
            <span>Earned: {balance?.totalEarned ?? 0}</span>
            <span>Spent: {balance?.totalSpent ?? 0}</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-3">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No transactions yet. Mark teaching in a session to earn tokens.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between bg-slate-800 rounded-xl p-4 shadow-sm border border-purple-500/10">
                <div>
                  <p className="font-medium capitalize">{tx.type}</p>
                  <p className="text-sm text-gray-400">{tx.description}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} 🪙
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

