import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { communitiesApi } from '../../api/endpoints';
import type { Community } from '../../types';
import { CardSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

function CommunityCard({ community }: { community: Community }) {
  const qc = useQueryClient();
  const joinMutation = useMutation({
    mutationFn: () => community.isJoined ? communitiesApi.leave(community.id) : communitiesApi.join(community.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['communities'] }),
    onError: () => toast.error('Action failed'),
  });

  const CATEGORY_COLORS: Record<string, string> = {
    TECH: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    ARTS: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    SPORTS: 'text-green-400 bg-green-500/10 border-green-500/20',
    MUSIC: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    FOOD: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    GAMING: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    DEFAULT: 'text-text-muted bg-muted border-border',
  };

  const catColor = CATEGORY_COLORS[community.category] ?? CATEGORY_COLORS.DEFAULT;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all">
      {/* Banner */}
      <div className="h-24 bg-gradient-to-br from-primary/20 to-accent/20 relative">
        {community.bannerUrl && (
          <img src={community.bannerUrl} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${catColor}`}>
            {community.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <Link to={`/app/communities/${community.id}`} className="font-semibold text-text-primary hover:text-primary transition-colors truncate block">
              {community.name}
            </Link>
            <p className="text-xs text-text-muted mt-0.5">{community.memberCount.toLocaleString()} members</p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); joinMutation.mutate(); }}
            disabled={joinMutation.isPending}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              community.isJoined
                ? 'bg-muted border border-border text-text-secondary hover:border-red-500/40 hover:text-red-400'
                : 'bg-primary text-white hover:bg-primary-light'
            }`}
          >
            {community.isJoined ? 'Leave' : 'Join'}
          </button>
        </div>
        {community.description && (
          <p className="text-text-muted text-sm line-clamp-2">{community.description}</p>
        )}
      </div>
    </div>
  );
}

export default function CommunitiesPage() {
  const [search, setSearch] = useState('');
  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => communitiesApi.getAll().then((r) => r.data),
  });

  const filtered = communities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()),
  );

  const joined = filtered.filter((c) => c.isJoined);
  const discover = filtered.filter((c) => !c.isJoined);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Users size={20} className="text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Communities</h1>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search communities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">{[1,2,3].map((i) => <CardSkeleton key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🏘️" title="No communities found" description="Try a different search or check back later" />
        ) : (
          <>
            {joined.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Your Communities</p>
                <div className="grid grid-cols-1 gap-3">
                  {joined.map((c) => <CommunityCard key={c.id} community={c} />)}
                </div>
              </div>
            )}
            {discover.length > 0 && (
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Discover</p>
                <div className="grid grid-cols-1 gap-3">
                  {discover.map((c) => <CommunityCard key={c.id} community={c} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
