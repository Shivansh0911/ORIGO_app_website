import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Zap, GraduationCap, Sparkles, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { discoverApi, matchesApi, communitiesApi, rizzApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import {
  rankCandidates, primaryIntent, compatibilityBand,
  type Intent, type ScoredUser, type Viewer, type CommunityRef,
} from '../../lib/matching';
import { track } from '../../lib/telemetry';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const INTENTS: { key: Intent; label: string; emoji: string }[] = [
  { key: 'FRIENDS', label: 'Friends', emoji: '🤝' },
  { key: 'DATING', label: 'Dating', emoji: '💜' },
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

function ProfileCard({ user, onLike, onPass, onRizz }: {
  user: ScoredUser; onLike: () => void; onPass: () => void; onRizz: () => void;
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

        <WhyThisMatch user={user} />

        <div className="flex gap-3">
          <button
            onClick={onPass}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted hover:bg-border rounded-xl transition-colors text-text-secondary"
          >
            <X size={18} /> Pass
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
            <Heart size={18} /> Like
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function DiscoverPage() {
  const user = useAuthStore((s) => s.user);
  const [intent, setIntent] = useState<Intent>(() => primaryIntent(user?.lookingFor ?? []));
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
      collegeName: user.collegeName,
      lookingFor: user.lookingFor,
      interests: user.interests,
      communities,
    };
  }, [user, myCommunities]);

  const ranked = useMemo(() => {
    if (!viewer) return [];
    return rankCandidates(viewer, people, { intent });
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

  if (isLoading) return (
    <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-text-primary">Discover</h1>
            <p className="text-text-muted text-sm">Ranked for you · {INTENTS.find((i) => i.key === intent)?.label}</p>
          </div>
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

      <div className="flex-1 flex items-start justify-center pt-8 px-4">
        <AnimatePresence mode="wait">
          {current ? (
            <ProfileCard key={current.id} user={current} onLike={handleLike} onPass={handlePass} onRizz={handleRizz} />
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
