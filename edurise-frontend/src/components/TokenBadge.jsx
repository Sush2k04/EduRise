import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenAPI } from '../services/api';

export default function TokenBadge() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    let mounted = true;
    tokenAPI
      .getBalance()
      .then((res) => {
        if (mounted) setBalance(res.balance);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (balance === null) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/token-history')}
      className="flex items-center gap-1 bg-yellow-200/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-semibold hover:bg-yellow-200/30 transition"
      title="View token history"
    >
      🪙 {balance}
    </button>
  );
}

