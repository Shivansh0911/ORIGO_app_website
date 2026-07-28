import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Heart, MessageSquare, Send, Plus, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { communitiesApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import type { Post, CommunityEvent } from '../../types';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

type Tab = 'posts' | 'events';

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('posts');
  const [composerOpen, setComposerOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: community, isLoading: loadingCom } = useQuery({
    queryKey: ['community', id],
    queryFn: () => communitiesApi.getOne(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['community-posts', id],
    queryFn: () => communitiesApi.getPosts(id!).then((r) => r.data),
    enabled: !!id && tab === 'posts',
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['community-events', id],
    queryFn: () => communitiesApi.getEvents(id!).then((r) => r.data),
    enabled: !!id && tab === 'events',
  });

  const createPost = useMutation({
    mutationFn: () => communitiesApi.createPost(id!, { content: postContent }),
    onSuccess: () => {
      setPostContent(''); setComposerOpen(false);
      qc.invalidateQueries({ queryKey: ['community-posts', id] });
      toast.success('Post created!');
    },
    onError: () => toast.error('Failed to post'),
  });

  const toggleLike = useMutation({
    mutationFn: (post: Post) => post.isLiked ? communitiesApi.unlikePost(post.id) : communitiesApi.likePost(post.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-posts', id] }),
  });

  const addComment = useMutation({
    mutationFn: (postId: string) => communitiesApi.addComment(postId, commentInputs[postId] ?? ''),
    onSuccess: (_, postId) => {
      setCommentInputs((p) => ({ ...p, [postId]: '' }));
      qc.invalidateQueries({ queryKey: ['community-posts', id] });
    },
  });

  const rsvpEvent = useMutation({
    mutationFn: (_e: CommunityEvent) => Promise.resolve(),
    onSuccess: () => toast('RSVP coming soon!', { icon: '🗓️' }),
  });

  if (loadingCom) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;
  if (!community) return <div className="p-6 text-text-muted">Community not found</div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="relative h-36 bg-gradient-to-br from-primary/30 to-accent/20 shrink-0">
        {community.bannerUrl && <img src={community.bannerUrl} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
        <button onClick={() => navigate('/app/communities')} className="absolute top-3 left-3 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="absolute bottom-3 left-4">
          <h1 className="text-xl font-bold text-white">{community.name}</h1>
          <p className="text-white/70 text-sm">{community.memberCount.toLocaleString()} members</p>
        </div>
        <button onClick={() => setComposerOpen(true)} className="absolute bottom-3 right-4 flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-3 py-1.5 rounded-xl text-sm font-medium transition-colors">
          <Plus size={14} /> Post
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {(['posts', 'events'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {tab === 'posts' && (
          loadingPosts ? <div className="flex justify-center py-8"><Spinner /></div> :
          posts.map((post: Post) => (
            <div key={post.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <Avatar src={post.author.avatarUrl} name={post.author.name} size={36} />
                <div>
                  <p className="font-medium text-text-primary text-sm">{post.author.name}</p>
                  <p className="text-xs text-text-muted">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
              {/* Media grid */}
              {post.mediaUrls.length > 0 && (
                <div className={`grid gap-1.5 mb-3 ${post.mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {post.mediaUrls.slice(0, 4).map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 3 && post.mediaUrls.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                          +{post.mediaUrls.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => toggleLike.mutate(post)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${post.isLiked ? 'text-accent' : 'text-text-muted hover:text-accent'}`}
                >
                  <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
                  {post.likeCount}
                </button>
                <button
                  onClick={() => setExpandedComments((prev) => { const n = new Set(prev); n.has(post.id) ? n.delete(post.id) : n.add(post.id); return n; })}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
                >
                  <MessageSquare size={16} /> {post.commentCount}
                </button>
              </div>
              {expandedComments.has(post.id) && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="flex gap-2">
                    <Avatar src={user?.avatarUrl} name={user?.name ?? ''} size={28} />
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment…"
                        value={commentInputs[post.id] ?? ''}
                        onChange={(e) => setCommentInputs((p) => ({ ...p, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addComment.mutate(post.id)}
                        className="flex-1 bg-muted border border-border rounded-xl px-3 py-1.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                      />
                      <button onClick={() => addComment.mutate(post.id)} className="text-primary hover:text-primary-light transition-colors">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {tab === 'events' && (
          loadingEvents ? <div className="flex justify-center py-8"><Spinner /></div> :
          events.map((evt: CommunityEvent) => (
            <div key={evt.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {evt.bannerUrl && <img src={evt.bannerUrl} alt="" className="w-full h-32 object-cover" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary">{evt.title}</h3>
                    <div className="flex items-center gap-1.5 text-text-muted text-sm mt-1">
                      <Calendar size={14} />
                      {new Date(evt.startAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {evt.location && <p className="text-text-muted text-sm mt-0.5">📍 {evt.location}</p>}
                    {evt.description && <p className="text-text-secondary text-sm mt-2">{evt.description}</p>}
                    <p className="text-xs text-text-muted mt-2">{evt.rsvpCount} attending</p>
                  </div>
                  <button
                    onClick={() => rsvpEvent.mutate(evt)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      evt.isRsvped ? 'bg-primary/20 text-primary border border-primary/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30' : 'bg-primary text-white hover:bg-primary-light'
                    }`}
                  >
                    {evt.isRsvped ? 'Going ✓' : 'RSVP'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create post modal */}
      <Modal open={composerOpen} onClose={() => setComposerOpen(false)} title="Create Post">
        <textarea
          placeholder="Share something with this community…"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          rows={4}
          className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors resize-none text-sm"
        />
        <button
          onClick={() => createPost.mutate()}
          disabled={!postContent.trim() || createPost.isPending}
          className="w-full mt-3 py-2.5 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {createPost.isPending ? 'Posting…' : 'Post'}
        </button>
      </Modal>
    </div>
  );
}
