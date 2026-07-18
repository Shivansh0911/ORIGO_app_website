import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Trophy } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useFreshersStore } from '../../store/freshersStore';
import { QUESTS } from '../../lib/freshers/content';
import HappeningCarousel from '../../components/happening/HappeningCarousel';

const QUICK_LINKS = [
  { to: '/app/intro-card', emoji: '🎴', title: 'Intro Card', desc: 'Make a shareable card' },
  { to: '/app/batch', emoji: '🎓', title: 'Batch Space', desc: 'Meet your batch early' },
  { to: '/app/prom', emoji: '💃', title: 'Prom Radar', desc: 'Find your Freshers’ Night crew' },
  { to: '/app/seniors', emoji: '🧭', title: 'Senior Connect', desc: 'Ask someone who’s been there' },
  { to: '/app/met', emoji: '🤝', title: 'We Met', desc: 'Reconnect with people you meet' },
  { to: '/app/communities', emoji: '🏘️', title: 'Communities', desc: 'Find your people' },
];

function QuestRow({
  quest, done, onGo,
}: { quest: (typeof QUESTS)[number]; done: boolean; onGo: () => void }) {
  return (
    <button
      onClick={onGo}
      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors text-left"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${done ? 'bg-green/15' : 'bg-primary/10'}`}>
        {done ? <Check size={20} className="text-green" /> : quest.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${done ? 'text-text-muted line-through' : 'text-text-primary'}`}>{quest.title}</p>
        <p className="text-text-muted text-sm truncate">{quest.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold text-amber">+{quest.points}</span>
        {!done && <ChevronRight size={16} className="text-text-muted" />}
      </div>
    </button>
  );
}

export default function FreshersPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const completedQuests = useFreshersStore((s) => s.completedQuests);

  const totalPoints = QUESTS.reduce((s, q) => s + q.points, 0);
  const earned = QUESTS.filter((q) => completedQuests.includes(q.id)).reduce((s, q) => s + q.points, 0);
  const pct = Math.round((earned / totalPoints) * 100);

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">
      {/* Welcome */}
      <div>
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
          🎒 FRESHERS HQ
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome{user ? `, ${user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-text-muted text-sm mt-1 max-w-xl">
          Arrive already knowing people. Post your Intro Card, meet your batch, and lock in your Freshers’ Night crew — all before day one.
        </p>
      </div>

      {/* Happening */}
      <HappeningCarousel />

      {/* Quests */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Trophy size={18} className="text-amber" /> Freshers Quests
          </h2>
          <span className="text-sm text-text-muted tabular-nums">{earned}/{totalPoints} pts</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden mb-4">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-2">
          {QUESTS.map((q) => (
            <QuestRow
              key={q.id}
              quest={q}
              done={completedQuests.includes(q.id)}
              onGo={() => q.to && navigate(q.to)}
            />
          ))}
        </div>
        {pct === 100 && (
          <div className="mt-4 p-4 rounded-2xl bg-green/10 border border-green/30 text-center">
            <p className="text-green font-semibold">🎉 Day One badge unlocked!</p>
            <p className="text-text-muted text-sm mt-1">Only this batch will ever earn it. Welcome to campus.</p>
          </div>
        )}
      </section>

      {/* Quick links */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-3">Jump in</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map((l) => (
            <button
              key={l.to}
              onClick={() => navigate(l.to)}
              className="p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors text-left"
            >
              <div className="text-2xl mb-2">{l.emoji}</div>
              <p className="text-text-primary font-semibold text-sm">{l.title}</p>
              <p className="text-text-muted text-xs mt-0.5">{l.desc}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
