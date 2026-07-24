import { useEffect, useState } from 'react';
import { BadgeCheck, CheckCircle2, Zap } from 'lucide-react';
import Avatar from '../ui/Avatar';
import type { Pulse, PulseCategory } from '../../types';

const CATEGORY_LABELS: Record<PulseCategory, string> = {
  CHILL: 'Chill',
  MOVE: 'Move',
  PLAY: 'Play',
  TALK: 'Talk',
  GROW: 'Grow',
  DATE_PRACTICE: 'Date Practice',
};

// UI-01: semantic tokens — primary for social vibes, green for physical, amber for growth, accent for dating
const CATEGORY_CHIP: Record<PulseCategory, string> = {
  CHILL:         'bg-primary/10 text-primary',
  TALK:          'bg-primary/10 text-primary',
  MOVE:          'bg-green-100 text-green-700',
  PLAY:          'bg-green-100 text-green-700',
  GROW:          'bg-amber-100 text-amber-700',
  DATE_PRACTICE: 'bg-accent/10 text-accent',
};

// UI-02: timer bar colour: green → amber → red as time depletes
function barColor(pct: number): string {
  if (pct > 50) return 'bg-green-400';
  if (pct > 20) return 'bg-amber-400';
  return 'bg-red-400';
}

function usePulseTimer(createdAt: string, expiresAt: string) {
  const expMs = new Date(expiresAt).getTime();
  const totalMs = expMs - new Date(createdAt).getTime();

  const snapshot = () => {
    const remaining = Math.max(0, expMs - Date.now());
    const pct = totalMs > 0 ? (remaining / totalMs) * 100 : 0;
    const h = Math.floor(remaining / 3_600_000);
    const m = Math.floor((remaining % 3_600_000) / 60_000);
    const s = Math.floor((remaining % 60_000) / 1000);
    const label = remaining <= 0 ? 'Expired' : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
    return { remaining, pct, label };
  };

  const [state, setState] = useState(snapshot);

  useEffect(() => {
    if (state.remaining <= 0) return;
    const id = setInterval(() => setState(snapshot()), 1000);
    return () => clearInterval(id);
  }, [expiresAt, createdAt]);

  return state;
}

interface Props {
  pulse: Pulse;
  onRespond: (pulseId: string) => void;
  responding?: boolean;
  isOwn?: boolean;
  onCancel?: (pulseId: string) => void;
}

export default function PulseCard({ pulse, onRespond, responding, isOwn, onCancel }: Props) {
  const { pct, label, remaining } = usePulseTimer(pulse.createdAt, pulse.expiresAt);
  const expired = remaining <= 0;

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden transition-opacity ${expired ? 'opacity-50' : ''}`}>
      {/* UI-02: depleting timer bar — thin line at top of card */}
      <div className="h-0.5 bg-border w-full">
        <div
          className={`h-full transition-all duration-1000 ${barColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar src={pulse.author.avatarUrl} name={pulse.author.name} size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-text-primary truncate">{pulse.author.name}</span>
              {/* UI-01: BadgeCheck icon instead of text tick */}
              {pulse.author.isVerified && (
                <BadgeCheck size={14} className="text-primary shrink-0" />
              )}
            </div>
            {/* UI-01: semantic chip color */}
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${CATEGORY_CHIP[pulse.category]}`}>
              {CATEGORY_LABELS[pulse.category]}
            </span>
          </div>
          <span className={`text-xs tabular-nums shrink-0 ${expired ? 'text-red-400' : pct < 20 ? 'text-amber-500' : 'text-text-muted'}`}>
            {label}
          </span>
        </div>

        <p className="text-text-primary font-medium leading-snug">{pulse.text}</p>
        {pulse.vibe && <p className="text-text-muted text-sm italic">"{pulse.vibe}"</p>}

        <div className="flex gap-2 pt-1">
          {isOwn ? (
            <button
              onClick={() => onCancel?.(pulse.id)}
              className="flex-1 py-2 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              Cancel
            </button>
          ) : pulse.hasResponded ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-green-600 bg-green-50 rounded-xl">
              <CheckCircle2 size={14} />
              You're in!
            </div>
          ) : (
            <button
              onClick={() => onRespond(pulse.id)}
              disabled={responding || expired}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50 transition-colors"
            >
              <Zap size={14} />
              {responding ? 'Joining…' : "I'm in"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
