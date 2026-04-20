import { Medal, Trophy } from 'lucide-react';
import { formatCurrency } from '../utils/date';

export default function LeaderboardCard({ entry, rank }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${rank === 1 ? 'bg-gold/20 text-gold' : 'bg-navy/10 text-navy'}`}>
          {rank === 1 ? <Trophy className="h-5 w-5" /> : <Medal className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{entry.donorName}</p>
          <p className="text-xs text-muted">{entry.totalDeliveries || 0} deliveries verified</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-accent">{formatCurrency(entry.totalDonated || 0)}</p>
          <p className="text-xs text-muted">Rank #{rank}</p>
        </div>
      </div>
    </div>
  );
}

