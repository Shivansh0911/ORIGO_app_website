import { useEffect, useState } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
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

const CATEGORY_COLORS: Record<PulseCategory, string> = {
  CHILL: 'bg-blue-100 text-blue-700',
  MOVE: 'bg-green-100 text-green-700',
  PLAY: 'bg-yellow-100 text-yellow-700',
  TALK: 'bg-purple-100 text-purple-700',
  GROW: 'bg-teal-100 text-teal-700',
  DATE_PRACTICE: 'bg-pink-100 text-pink-700',
};

function useCountdown(expiresAt: string) {
  const getLeft = () => Math.max(0, new Date(expiresAt).getTime() - Date.now());
  const [ms, setMs] = useState(getLeft);

  useEffect(() => {
    if (ms <= 0) return;
    const id = setInterval(() => setMs(getLeft()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return ms <= 0 ? 'Expired' : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
}

interface Props {
  pulse: Pulse;
  onRespond: (pulseId: string) => void;
  responding?: boolean;
  isOwn?: boolean;
  onCancel?: (pulseId: string) => void;
}

export default function PulseCard({ pulse, onRespond, responding, isOwn, onCancel }: Props) {
  const countdown = useCountdown(pulse.expiresAt);
  const expired = countdown === 'Expired';

  return (
    <div className={`bg-card border border-border rounded-2xl p-4 space-y-3 transition-opacity ${expired ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <Avatar src={pulse.author.avatarUrl} name={pulse.author.name} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-text-primary truncate">{pulse.author.name}</span>
            {pulse.author.isVerified && <span className="text-primary text-xs">✓</span>}
          </div>
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${CATEGORY_COLORS[pulse.category]}`}>
            {CATEGORY_LABELS[pulse.category]}
          </span>
        </div>
        <span className={`text-xs tabular-nums shrink-0 ${expired ? 'text-red-400' : 'text-text-muted'}`}>
          {countdown}
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
  );
}
