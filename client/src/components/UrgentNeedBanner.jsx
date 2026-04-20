import { Siren, TimerReset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCountdownLabel } from '../utils/date';

export default function UrgentNeedBanner({ need, ngoName, ngoId }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(need.type === 'money' ? `/ngo/${ngoId}/donate` : `/ngo/${ngoId}/deliver`, { state: { need } })}
      className="w-full rounded-2xl border border-rose-200 bg-white p-4 text-left shadow-card animate-pulseBorder"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
          <Siren className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Urgent Need</p>
              <h3 className="mt-1 text-sm font-semibold text-navy">{need.title}</h3>
              <p className="mt-1 text-xs text-muted">{ngoName}</p>
            </div>
            {need.expiresAt ? (
              <span className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700">
                <TimerReset className="h-3.5 w-3.5" />
                {getCountdownLabel(need.expiresAt)}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted">{need.description}</p>
        </div>
      </div>
    </button>
  );
}

