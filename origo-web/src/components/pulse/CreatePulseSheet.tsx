import { useState } from 'react';
import { X } from 'lucide-react';
import type { PulseCategory } from '../../types';

// Order is deliberate. CHILL / MOVE / PLAY / GROW are the everyday social
// cases and take centre stage. TALK and DATE_PRACTICE come last: TALK
// ("need someone to vent to") is a vulnerability broadcast that attracts the
// wrong responders, and DATE_PRACTICE is romantic framing on what is meant to
// be the default, non-dating surface. Neither should be the first thing a new
// user sees.
const CATEGORIES: { value: PulseCategory; label: string; desc: string; defaultCap: number }[] = [
  { value: 'CHILL',         label: 'Chill',         desc: 'Hang out, do nothing, vibe',   defaultCap: 3 },
  { value: 'MOVE',          label: 'Move',          desc: 'Walk, gym, sport, outdoor',    defaultCap: 3 },
  { value: 'PLAY',          label: 'Play',          desc: 'Games, movie, fun activity',   defaultCap: 4 },
  { value: 'GROW',          label: 'Grow',          desc: 'Study group, skill swap',      defaultCap: 4 },
  { value: 'TALK',          label: 'Talk',          desc: 'Vent, study, deep chat',       defaultCap: 1 },
  { value: 'DATE_PRACTICE', label: 'Date Practice', desc: 'Low-stakes coffee / walk',     defaultCap: 1 },
];

const MAX_CAP = 10; // mirrors PULSE_MAX_RESPONSES; server clamps regardless

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
  onSubmit: (data: { category: PulseCategory; text: string; vibe?: string; maxResponses: number }) => void;
  loading: boolean;
}

export default function CreatePulseSheet({ onClose, onSubmit, loading }: Props) {
  const [category, setCategory] = useState<PulseCategory | null>(null);
  const [text, setText] = useState('');
  const [vibe, setVibe] = useState('');
  const [maxResponses, setMaxResponses] = useState(3);

  const placeholders = category ? PLACEHOLDERS[category] : [];
  const placeholder = placeholders[Math.floor(Date.now() / 10000) % placeholders.length] ?? 'What do you want to do right now?';

  // Picking a category suggests a sensible group size — a badminton game wants
  // 3, venting wants 1 — while leaving the author free to change it.
  const pickCategory = (value: PulseCategory) => {
    setCategory(value);
    setMaxResponses(CATEGORIES.find((c) => c.value === value)?.defaultCap ?? 3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !text.trim()) return;
    onSubmit({ category, text: text.trim(), vibe: vibe.trim() || undefined, maxResponses });
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
                  onClick={() => pickCategory(c.value)}
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

          {/* How many people — the author's own cap on how many can join */}
          <div>
            <p className="text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wide">How many people?</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMaxResponses((n) => Math.max(1, n - 1))}
                disabled={maxResponses <= 1}
                aria-label="Fewer people"
                className="w-10 h-10 rounded-xl bg-muted border border-border text-text-secondary text-lg font-semibold hover:border-primary/50 disabled:opacity-40 transition-colors"
              >
                −
              </button>
              <span className="text-lg font-bold text-text-primary tabular-nums w-8 text-center">{maxResponses}</span>
              <button
                type="button"
                onClick={() => setMaxResponses((n) => Math.min(MAX_CAP, n + 1))}
                disabled={maxResponses >= MAX_CAP}
                aria-label="More people"
                className="w-10 h-10 rounded-xl bg-muted border border-border text-text-secondary text-lg font-semibold hover:border-primary/50 disabled:opacity-40 transition-colors"
              >
                +
              </button>
              <p className="text-xs text-text-muted flex-1">
                Your Pulse closes once {maxResponses === 1 ? 'someone joins' : `${maxResponses} people join`}.
              </p>
            </div>
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
