import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Zap, GraduationCap, Sparkles, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { discoverApi, matchesApi, communitiesApi, rizzApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import {
  rankCandidates, primaryIntent, compatibilityBand,
  type Intent, type ScoredUser, type Viewer, type CommunityRef, type MatchContext,
} from '../../lib/matching';
import { track } from '../../lib/telemetry';
import { DiscoverSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

// DATING is deliberately not offered here. Origo is a socialising platform,
// not a dating app — romantic discovery is opt-in and episodic (Radar events),
// never the default surface (see decisions/0004). Surfacing "Dating" as a chip
// on the main people-browsing page re-codes the whole product as a dating app
// for anyone who taps it, regardless of what the rest of the copy says. The
// scoring engine still supports the intent; this UI just never asks for it.
// Interim fix ahead of the full Discover rewrite (BUILD_PLAN.md 1.1/1.7).
const INTENTS: { key: Intent; label: string; emoji: string }[] = [
  { key: 'FRIENDS', label: 'Friends', emoji: '🤝' },
  { key: 'NETWORKING', label: 'Networking', emoji: '🚀' },
  { key: 'STUDY_BUDDY', label: 'Study buddy', emoji: '📚' },
];

const BAND_CLASS: Record<ReturnType<typeof compatibilityBand>['tone'], string> = {
  great: 'bg-green/20 text-green border-green/30',
  strong: 'bg-primary/20 text-primary border-primary/30',
  ok: 'bg-primary/10 text-primary-light border-primary/20',
  new: 'bg-border text-text-muted border-border',
};

function CompatibilityBadge({ score }: { score: number }) {
  const { label, tone } = compatibilityBand(score);
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${BAND_CLASS[tone]}`}>
      {label}
    </span>
  );
}

/** Expandable "why this match" breakdown, driven by the client-side scorer. */
function WhyThisMatch({ user }: { user: ScoredUser }) {
  const [open, setOpen] = useState(false);
  const top = [...user.components].sort((a, b) => b.points - a.points).slice(0, 4);
  return (
    <div className="mb-4">
      {user.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {user.reasons.slice(0, 2).map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs text-green bg-green/10 border border-green/20 px-2 py-1 rounded-full">
              <Sparkles size={11} /> {r}
            </span>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        Why this match
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-3">
              {top.map((c) => (
                <div key={c.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">{c.label}</span>
                    <span className="text-text-muted tabular-nums">{Math.round(c.value * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(c.value * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileCard({ user, onLike, onPass, onRizz, onReact }: {
  user: ScoredUser; onLike: () => void; onPass: () => void; onRizz: () => void;
  onReact: (prompt: { label: string; answer: string }) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card border border-border rounded-2xl overflow-hidden max-w-sm w-full"
    >
      <div className="relative h-72 bg-muted flex items-center justify-center">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-8xl">{user.name.charAt(0)}</div>
        )}
        <div className="absolute top-3 right-3">
          <CompatibilityBadge score={user.compatibilityScore} />
        </div>
        {user.isVerified && (
          <div className="absolute top-3 left-3 bg-primary/90 text-white text-xs px-2 py-1 rounded-full font-medium">
            ✓ Verified
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h3 className="text-lg font-bold text-text-primary">{user.name}</h3>
            <p className="text-text-muted text-sm">@{user.username}</p>
          </div>
          {user.isPremium && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30 mt-1">
              ✨ Premium
            </span>
          )}
        </div>

        {user.collegeName && (
          <div className="flex items-center gap-1.5 text-text-secondary text-sm mb-2">
            <GraduationCap size={14} />
            {user.collegeName}
          </div>
        )}

        {user.bio && <p className="text-text-secondary text-sm mb-3 line-clamp-2">{user.bio}</p>}

        {user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {user.interests.slice(0, 5).map((ui) => (
              <span key={ui.interestId} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                {ui.interest.emoji} {ui.interest.name}
              </span>
            ))}
            {user.interests.length > 5 && (
              <span className="text-xs text-text-muted px-2 py-1">+{user.interests.length - 5}</span>
            )}
          </div>
        )}

        {/* Prompts, each reactable — this is what kills the "hey" opener. Tapping
            one starts a Rizz session with the opener already quoting what they
            wrote, so the first message is never a blank page. */}
        {user.prompts && user.prompts.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {user.prompts.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => onReact(p)}
                className="text-left px-3 py-2.5 rounded-xl bg-muted hover:bg-primary/10 border border-border hover:border-primary/30 transition-colors group"
              >
                <p className="text-[10px] uppercase tracking-wide text-text-muted">{p.label}</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-sm text-text-primary italic">"{p.answer}"</p>
                  <Zap size={14} className="shrink-0 text-text-muted group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        <WhyThisMatch user={user} />

        <div className="flex gap-3">
          <button
            onClick={onPass}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted hover:bg-border rounded-xl transition-colors text-text-secondary"
          >
            <X size={18} /> Skip
          </button>
          <button
            onClick={onRizz}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-border rounded-xl transition-colors text-primary"
            title="Start a Rizz In 5 session"
          >
            <Zap size={18} />
          </button>
          <button
            onClick={onLike}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-light rounded-xl transition-colors text-white font-medium"
          >
            <Heart size={18} /> Say hi
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [intent, setIntent] = useState<Intent>(() => {
    const derived = primaryIntent(user?.lookingFor ?? []);
    // Guard against a DATING-only lookingFor selecting a chip we don't render.
    return INTENTS.some((i) => i.key === derived) ? derived : 'FRIENDS';
  });
  const [page, setPage] = useState(1);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['discover', page, intent],
    queryFn: () => discoverApi.getPeople({ page, lookingFor: intent }).then((r) => r.data),
  });

  // My joined communities → viewer graph context. Candidate community data isn't
  // in the /discover payload yet, so the graph term stays inactive until the
  // backend includes it (documented in IMPLEMENTATION.md). Wiring it here means
  // the moment that data arrives, mutual-community scoring lights up for free.
  const { data: myCommunities = [] } = useQuery({
    queryKey: ['my-communities-graph'],
    queryFn: () => communitiesApi.getAll().then((r) => r.data.filter((c) => c.isJoined)),
    staleTime: 5 * 60_000,
  });

  const viewer: Viewer | null = useMemo(() => {
    if (!user) return null;
    const communities: CommunityRef[] = myCommunities.map((c) => ({
      id: c.id, memberCount: c.memberCount, category: c.category,
    }));
    return {
      id: user.id,
      collegeName: user.collegeName ?? null,
      lookingFor: user.lookingFor ?? [],
      interests: user.interests ?? [],
      communities,
    };
  }, [user, myCommunities]);

  const ranked = useMemo(() => {
    if (!viewer) return [];
    // Build per-candidate context from data returned by /discover (BLOCK-3 fix).
    // Graph (Adamic-Adar) + responsiveness terms now fire when backend supplies them.
    const contextById: Record<string, MatchContext> = {};
    for (const p of people) {
      if (p.communities || p.responsiveness !== undefined) {
        contextById[p.id] = {
          candidateCommunities: p.communities,
          candidateResponsiveness: p.responsiveness,
        };
      }
    }
    return rankCandidates(viewer, people, { intent, contextById });
  }, [viewer, people, intent]);

  const unseen = ranked.filter((u) => !seen.has(u.id));
  const current = unseen[0] ?? null;

  const matchMutation = useMutation({
    mutationFn: (receiverId: string) => matchesApi.sendMatch(receiverId),
    onSuccess: () => toast.success('Match request sent! ⚡'),
    onError: () => toast.error('Already sent or error occurred'),
  });

  const rizzMutation = useMutation({
    mutationFn: (receiverId: string) => rizzApi.startSession(receiverId),
    onSuccess: () => toast.success('Rizz In 5 started — you have 5 messages ⚡'),
    onError: () => toast.error('Could not start Rizz session'),
  });

  // Log the profile currently on top of the stack (a training impression).
  useEffect(() => {
    if (current) track('discover_impression', { candidateId: current.id, intent, score: current.compatibilityScore });
  }, [current?.id, intent]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = () => {
    if (!current) return;
    setSeen((prev) => new Set([...prev, current.id]));
    if (unseen.length <= 2) setPage((p) => p + 1);
  };

  const handleLike = () => {
    if (!current) return;
    track('discover_like', { candidateId: current.id, intent, score: current.compatibilityScore });
    matchMutation.mutate(current.id);
    advance();
  };
  const handleRizz = () => {
    if (!current) return;
    track('discover_rizz_start', { candidateId: current.id, intent, score: current.compatibilityScore });
    rizzMutation.mutate(current.id);
    advance();
  };
  const handlePass = () => {
    if (current) track('discover_pass', { candidateId: current.id, intent, score: current.compatibilityScore });
    advance();
  };

  // Reacting to a prompt starts a Rizz session and jumps straight into the
  // chat with the opener already quoting what they wrote — the whole point
  // being that "hey" is no longer possible. The draft is left editable
  // (not auto-sent) so it's still the user's own message.
  const handleReact = async (prompt: { label: string; answer: string }) => {
    if (!current) return;
    track('discover_rizz_start', { candidateId: current.id, intent, score: current.compatibilityScore, viaPrompt: true });
    try {
      const { data: session } = await rizzApi.startSession(current.id);
      advance();
      navigate(`/app/rizz/${session.id}`, { state: { draft: `"${prompt.answer}" — ` } });
    } catch {
      toast.error('Could not start Rizz session');
    }
  };

  if (isLoading) return (
    <div className="p-4 max-w-sm mx-auto"><DiscoverSkeleton /></div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-primary">Discover</h1>
              {user?.collegeName ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30">
                  <GraduationCap size={13} /> {user.collegeName}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-card border border-border text-text-secondary">
                  🌐 All Campuses
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm mt-1">Ranked for you · {INTENTS.find((i) => i.key === intent)?.label}</p>
          </div>
          {/* Ship has no primary nav slot in the 3-tab layout — belongs here,
              in People, alongside Discover rather than competing for a tab. */}
          <Link
            to="/app/ship"
            className="flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent/10 border border-accent/30 px-3 py-1.5 rounded-full hover:bg-accent/20 transition-colors shrink-0"
          >
            <Heart size={13} /> Ship a Friend
          </Link>
        </div>
        {/* Intent selector — each intent uses a different scoring profile */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {INTENTS.map((it) => (
            <button
              key={it.key}
              onClick={() => { setIntent(it.key); setSeen(new Set()); setPage(1); track('discover_intent_change', { intent: it.key }); }}
              className={`shrink-0 text-sm px-3 py-1.5 rounded-full border transition-colors ${
                intent === it.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-transparent text-text-secondary border-border hover:border-primary/50'
              }`}
            >
              {it.emoji} {it.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center pt-4 md:pt-8 px-4">
        <AnimatePresence mode="wait">
          {current ? (
            <ProfileCard key={current.id} user={current} onLike={handleLike} onPass={handlePass} onRizz={handleRizz} onReact={handleReact} />
          ) : (
            <EmptyState
              icon="🧭"
              title="You've seen everyone for now"
              description="Try a different intent above, or check back soon for new people on campus"
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
