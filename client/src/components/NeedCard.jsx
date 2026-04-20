import { Clock3, HandCoins, PackageCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getCountdownLabel } from '../utils/date';

const urgencyColors = {
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-emerald-100 text-emerald-700',
};

export default function NeedCard({ need, ngoId }) {
  const navigate = useNavigate();
  const countdown = getCountdownLabel(need.expiresAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${urgencyColors[need.urgency] || urgencyColors.medium}`}>
              {need.urgency} priority
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{need.type}</span>
          </div>
          <h3 className="text-base font-semibold text-navy">{need.title}</h3>
          <p className="mt-1 text-sm text-muted">{need.description}</p>
        </div>
        <div className="rounded-2xl bg-accent/10 p-3 text-accent">
          {need.type === 'money' ? <HandCoins className="h-5 w-5" /> : <PackageCheck className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <div className="space-y-1 text-muted">
          {need.suggestedAmount ? <p>Suggested: {formatCurrency(need.suggestedAmount)}</p> : null}
          {countdown ? (
            <p className="flex items-center gap-1.5 text-rose-600">
              <Clock3 className="h-4 w-4" />
              {countdown}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => navigate(need.type === 'money' ? `/ngo/${ngoId}/donate` : `/ngo/${ngoId}/deliver`, { state: { need } })}
          className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${
            need.type === 'money' ? 'bg-accent text-white' : 'border border-navy text-navy'
          }`}
        >
          {need.type === 'money' ? 'Donate Money' : 'Deliver Items'}
        </button>
      </div>
    </motion.div>
  );
}

