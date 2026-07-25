import { useState } from 'react';
import { X } from 'lucide-react';
import type { PulseCategory } from '../../types';

const CATEGORIES: { value: PulseCategory; label: string; desc: string }[] = [
  { value: 'CHILL',         label: 'Chill',         desc: 'Hang out, do nothing, vibe' },
  { value: 'MOVE',          label: 'Move',           desc: 'Walk, gym, sport, outdoor' },
  { value: 'PLAY',          label: 'Play',           desc: 'Games, movie, fun activity' },
  { value: 'TALK',          label: 'Talk',           desc: 'Vent, study, deep chat' },
  { value: 'GROW',          label: 'Grow',           desc: 'Study group, skill swap' },
  { value: 'DATE_PRACTICE', label: 'Date Practice',  desc: 'Low-stakes coffee / walk' },
];

const PLACEHOLDERS: Record<PulseCategory, string[]> = {
  CHILL:         ['Anyone free to just sit at the canteen?', "Hostel lobby, who's around?"],
  MOVE:          ['Going for a walk in 20 mins', 'Anyone up for a quick badminton game?'],
  PLAY:          ['FIFA sesh, Hostel D common room', 'Movie night in my room, DM me'],
  TALK:          ['Need someone to vent to rn', 'Study buddy wanted for finals week'],
  GROW:          ['DSA practice group — anyone?', 'Want to swap skills: I teach Python, learn design'],
  DATE_PRACTICE: ['Coffee at the new café, no pressure', 'Walk around campus — casual get to know you'],
};

interface Props {
  onClose: () => void;
  onSubmit: (data: { category: PulseCategory; text: string; vibe?: string }) => void;
  loading: boolean;
}

export default function CreatePulseSheet({ onClose, onSubmit, loading }: Props) {
  const [category, setCategory] = useState<PulseCategory | null>(null);
  const [text, setText] = useState('');
  const [vibe, setVibe] = useState('');

  const placeholders = category ? PLACEHOLDERS[category] : [];
  const placeholder = placeholders[Math.floor(Date.now() / 10000) % placeholders.length] ?? 'What do you want to do right now?';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !text.trim()) return;
    onSubmit({ category, text: text.trim(), vibe: vibe.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-text-primary">New Pulse</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category picker */}
          <div>
            <p className="text-xs text-text-muted mb-2 font-medium uppercase tracking-wide">What kind of vibe?</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all border
                    ${category === c.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-muted text-text-secondary border-border hover:border-primary/50'}`}
                >
                  <div>{c.label}</div>
                  <div className={`text-[10px] mt-0.5 ${category === c.value ? 'text-white/80' : 'text-text-muted'}`}>{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wide">What's the plan?</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 140))}
              placeholder={placeholder}
              rows={3}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-right text-xs text-text-muted mt-1">{text.length}/140</p>
          </div>

          {/* Vibe (optional) */}
          <div>
            <p className="text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wide">Add a vibe tag (optional)</p>
            <input
              type="text"
              value={vibe}
              onChange={(e) => setVibe(e.target.value.slice(0, 60))}
              placeholder="e.g. low energy, night owl, introverts welcome"
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!category || !text.trim() || loading}
            className="w-full py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-light disabled:opacity-50 transition-colors"
          >
            {loading ? 'Posting…' : 'Send Pulse'}
          </button>
        </form>
      </div>
    </div>
  );
}
