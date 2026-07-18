import { useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Zap, Users, Heart, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { discoverApi, rizzApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { useFreshersStore, type PromMode } from '../../store/freshersStore';
import { PROM_INFO } from '../../lib/freshers/content';
import { rankCandidates, compatibilityBand, type Viewer } from '../../lib/matching';
import { track } from '../../lib/telemetry';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';

export default function PromRadarPage() {
  const user = useAuthStore((s) => s.user);
  const { promOptIn, promMode, promNote, setProm } = useFreshersStore();

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['prom-radar'],
    queryFn: () => discoverApi.getPeople({ page: 1 }).then((r) => r.data),
    enabled: promOptIn,
  });

  const viewer: Viewer | null = useMemo(() => user ? {
    id: user.id, collegeName: user.collegeName, lookingFor: user.lookingFor, interests: user.interests,
  } : null, [user]);

  // Group mode ranks on friendship signal; date mode on dating signal.
  const ranked = useMemo(() => {
    if (!viewer) return [];
    return rankCandidates(viewer, people, {
      intent: promMode === 'DATE' ? 'DATING' : 'FRIENDS',
      diversity: 0.3,
    }).slice(0, 12);
  }, [viewer, people, promMode]);

  const rizz = useMutation({
    mutationFn: (id: string) => rizzApi.startSession(id),
    onSuccess: () => toast.success('Prom Rizz started — you have 5 messages ⚡'),
    onError: () => toast.error('Could not start — maybe already connected'),
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border p-8 mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(108,61,255,0.25), rgba(255,107,157,0.25))' }}>
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #FF6B9D, transparent)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-black/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Clock size={13} /> {PROM_INFO.daysAway} DAYS AWAY
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Prom Radar</h1>
          <p className="text-white/80 text-sm max-w-md">
            {PROM_INFO.eventName} is coming. Most people don’t have a plan and are too shy to ask.
            Opt in, and Origo helps you find a date — or a whole table — before the night.
          </p>
          <p className="text-white/70 text-xs mt-3">💜 {PROM_INFO.optedInCount + (promOptIn ? 1 : 0)} freshers already opted in</p>
        </div>
      </div>

      {!promOptIn ? (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-medium">What are you looking for?</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {([
              { mode: 'GROUP' as PromMode, emoji: '🎉', title: 'Find my table', desc: 'Match into a crew of 4–6 to go together. No pressure, all vibes.' },
              { mode: 'DATE' as PromMode, emoji: '💜', title: 'Find a date', desc: 'One-on-one. We’ll surface people you’d actually click with.' },
            ]).map((opt) => (
              <button
                key={opt.mode}
                onClick={() => setProm({ mode: opt.mode })}
                className={`text-left p-5 rounded-2xl border transition-colors ${
                  promMode === opt.mode ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                <div className="text-2xl mb-2">{opt.emoji}</div>
                <p className="text-text-primary font-semibold">{opt.title}</p>
                <p className="text-text-muted text-sm mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>

          <textarea
            value={promNote}
            onChange={(e) => setProm({ note: e.target.value.slice(0, 120) })}
            placeholder="Optional: one line about your ideal prom plan…"
            rows={2}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
          />

          <button
            onClick={() => { setProm({ optIn: true }); track('prom_opt_in', { mode: promMode }); toast.success("You're on the Radar 💃"); }}
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors"
          >
            Opt in to Prom Radar
          </button>
          <p className="text-xs text-text-muted text-center">
            You’re only visible to other opted-in freshers. Opt out anytime.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-green/10 border border-green/30">
            <div className="w-10 h-10 rounded-full bg-green/20 flex items-center justify-center"><Check size={18} className="text-green" /></div>
            <div className="flex-1">
              <p className="text-text-primary font-semibold text-sm">You’re on the Radar</p>
              <p className="text-text-muted text-xs">
                Mode: {promMode === 'DATE' ? '💜 Find a date' : '🎉 Find my table'}
                {promNote ? ` · “${promNote}”` : ''}
              </p>
            </div>
            <button
              onClick={() => { setProm({ optIn: false }); track('prom_opt_out'); toast('Opted out of Prom Radar', { icon: '👋' }); }}
              className="text-xs text-text-muted hover:text-red-400 transition-colors"
            >
              Opt out
            </button>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">
              {promMode === 'DATE' ? 'People you might click with' : 'Crews forming near you'}
            </h2>
            <span className="text-xs text-text-muted">Ranked for you</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {ranked.map((u) => (
                <div key={u.id} className="p-4 rounded-2xl border border-border bg-card">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar src={u.avatarUrl} name={u.name} size={44} />
                    <div className="min-w-0">
                      <p className="text-text-primary font-semibold text-sm truncate">{u.name}</p>
                      <p className="text-text-muted text-xs truncate">{u.collegeName ?? '@' + u.username}</p>
                    </div>
                    <span className="ml-auto text-xs font-semibold text-primary shrink-0">{compatibilityBand(u.compatibilityScore).label}</span>
                  </div>
                  {u.reasons[0] && <p className="text-text-muted text-xs mb-3">✨ {u.reasons[0]}</p>}
                  <button
                    onClick={() => rizz.mutate(u.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-sm font-medium transition-colors"
                  >
                    {promMode === 'DATE' ? <Heart size={14} /> : <Users size={14} />}
                    {promMode === 'DATE' ? 'Shoot your shot' : 'Ask to join'}
                    <Zap size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
