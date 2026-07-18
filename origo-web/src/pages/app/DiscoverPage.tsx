import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Zap, Filter, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { discoverApi, matchesApi } from '../../api/endpoints';
import type { PublicUser } from '../../types';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

function CompatibilityBadge({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : score >= 40 ? 'bg-primary/20 text-primary border-primary/30'
    : 'bg-border text-text-muted border-border';
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${color}`}>
      {score}% match
    </span>
  );
}

function ProfileCard({ user, onLike, onPass }: { user: PublicUser; onLike: () => void; onPass: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card border border-border rounded-2xl overflow-hidden max-w-sm w-full"
    >
      {/* Avatar */}
      <div className="relative h-72 bg-muted flex items-center justify-center">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-8xl">{user.name.charAt(0)}</div>
        )}
        <div className="absolute top-3 right-3">
          {user.compatibilityScore !== undefined && (
            <CompatibilityBadge score={user.compatibilityScore} />
          )}
        </div>
        {user.isVerified && (
          <div className="absolute top-3 left-3 bg-primary/90 text-white text-xs px-2 py-1 rounded-full font-medium">
            ✓ Verified
          </div>
        )}
      </div>

      {/* Info */}
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

        {user.bio && (
          <p className="text-text-secondary text-sm mb-3 line-clamp-2">{user.bio}</p>
        )}

        {/* Interests */}
        {user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
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

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onPass}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-muted hover:bg-border rounded-xl transition-colors text-text-secondary"
          >
            <X size={18} /> Pass
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
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const { data: people = [], isLoading, refetch } = useQuery({
    queryKey: ['discover', page],
    queryFn: () => discoverApi.getPeople({ page }).then((r) => r.data),
  });

  const unseen = people.filter((u) => !seen.has(u.id));
  const current = unseen[0] ?? null;

  const matchMutation = useMutation({
    mutationFn: (receiverId: string) => matchesApi.sendMatch(receiverId),
    onSuccess: () => toast.success('Match request sent! ⚡'),
    onError: () => toast.error('Already sent or error occurred'),
  });

  const handleLike = () => {
    if (!current) return;
    matchMutation.mutate(current.id);
    advance();
  };

  const handlePass = () => advance();

  const advance = () => {
    if (!current) return;
    setSeen((prev) => new Set([...prev, current.id]));
    if (unseen.length <= 2) setPage((p) => p + 1);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <Spinner size="lg" />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Discover</h1>
          <p className="text-text-muted text-sm">Sorted by compatibility score</p>
        </div>
        <button className="flex items-center gap-2 text-text-secondary hover:text-white border border-border rounded-xl px-3 py-2 text-sm transition-colors">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Card stack */}
      <div className="flex-1 flex items-start justify-center pt-8 px-4">
        <AnimatePresence mode="wait">
          {current ? (
            <ProfileCard key={current.id} user={current} onLike={handleLike} onPass={handlePass} />
          ) : (
            <EmptyState
              icon="🧭"
              title="You've seen everyone nearby"
              description="Check back tomorrow for new people on campus"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Quick Rizz CTA */}
      {current && (
        <div className="px-6 pb-6 flex justify-center">
          <button className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-colors">
            <Zap size={14} /> Send a Rizz instead
          </button>
        </div>
      )}
    </div>
  );
}
