import { useEffect, useState } from 'react';
import LeaderboardCard from '../../components/LeaderboardCard';
import { fetchLeaderboard } from '../../services/ngoService';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetchLeaderboard().then(setEntries);
  }, []);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-md space-y-5 px-4 py-5">
        <section className="rounded-[28px] bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-accent">Community impact</p>
          <h1 className="mt-1 text-2xl font-bold text-navy">Giving leaderboard</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Celebrate the people creating regular care for elders through donations and deliveries.</p>
        </section>

        <div className="space-y-3">
          {entries.map((entry, index) => (
            <LeaderboardCard key={entry.uid} entry={entry} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

