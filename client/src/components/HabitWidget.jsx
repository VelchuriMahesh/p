import { Flame, Sparkles } from 'lucide-react';

export default function HabitWidget({ streakDays = 0, onDonate }) {
  return (
    <button
      type="button"
      onClick={onDonate}
      className="w-full rounded-[24px] bg-gradient-to-br from-accent to-[#ff8f5d] p-5 text-left text-white shadow-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white/85">Daily giving habit</p>
          <h3 className="mt-2 text-xl font-bold">Donate Rs. 10 today</h3>
          <p className="mt-2 text-sm text-white/85">Small daily kindness creates lasting meals and care.</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/15 px-4 py-3">
        <span className="text-sm font-medium">Current streak</span>
        <span className="flex items-center gap-2 text-lg font-bold">
          <Flame className="h-5 w-5" />
          {streakDays} day{streakDays === 1 ? '' : 's'}
        </span>
      </div>
    </button>
  );
}

