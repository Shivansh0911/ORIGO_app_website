import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { rizzApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import type { RizzMessage } from '../../types';

// MATCH_MAX_CONSECUTIVE on the backend (config/matching.ts) — the session
// flips to WAITING the moment count reaches this, so while status is ACTIVE,
// count is always 0 or 1. Kept in sync by hand since the frontend has no
// reason to fetch backend config for one number.
const MAX_CONSECUTIVE = 2;

function RizzBar({ count, status }: { count: number; status: string }) {
  const remaining = Math.max(0, MAX_CONSECUTIVE - count);
  const labels: Record<string, string> = {
    ACTIVE: remaining === 1
      ? 'Last one before you wait for a reply'
      : `${remaining} messages, then you wait for a reply`,
    WAITING: 'Waiting for them to reply',
    ACCEPTED: 'Chat unlocked! 🎉',
    // DECLINED is only ever visible to the target — the backend masks it to
    // EXPIRED on the initiator's own view (maskDeclineForInitiator), since a
    // campus rejection has a face and a timetable. Keep the copy distinct:
    // the target should see their own action reflected accurately.
    DECLINED: 'You declined this',
    EXPIRED: 'Session expired',
  };
  const isLastShot = status === 'ACTIVE' && remaining === 1;
  return (
    <div className="bg-muted border-b border-border px-4 py-2.5 flex items-center justify-between">
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < count;
          return (
            <div
              key={i}
              className={`h-2 w-8 rounded-full transition-all ${filled ? 'bg-primary' : 'bg-border'}`}
            />
          );
        })}
      </div>
      <p className={`text-xs font-medium ${isLastShot ? 'text-amber-600' : 'text-text-secondary'}`}>
        {labels[status] ?? ''}
      </p>
    </div>
  );
}

export default function RizzChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  // Seeded from Discover when the initiator reacted to a prompt instead of
  // starting cold — see DiscoverPage.handleReact. Left editable, never sent
  // automatically; the point is killing the blank page, not the user's voice.
  const [input, setInput] = useState(() => (location.state as { draft?: string } | null)?.draft ?? '');
  const [icebreaker, setIcebreaker] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery({
    queryKey: ['rizz-session', sessionId],
    queryFn: () => rizzApi.getSession(sessionId!).then((r) => r.data),
    enabled: !!sessionId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  // Rizz messages arrive via polling (5s interval on the query above).
  // Socket-based Rizz push is Phase 1 — the backend socket handler doesn't
  // emit rizz events yet. The polling interval is short enough for the UX.
  useEffect(() => {
    if (!socket || !sessionId) return;
    // Join own user room so backend can push future Rizz socket events
    socket.emit('join_conversation', sessionId);
  }, [socket, sessionId]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => rizzApi.sendMessage(sessionId!, content),
    onSuccess: () => {
      setInput('');
      qc.invalidateQueries({ queryKey: ['rizz-session', sessionId] });
      qc.invalidateQueries({ queryKey: ['rizz-sessions'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? 'Failed to send message');
    },
  });

  const loadIcebreaker = async () => {
    try {
      const { data } = await rizzApi.getIcebreaker(sessionId!);
      setIcebreaker(data.prompt);
    } catch { toast.error('No icebreaker available'); }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMutation.mutate(input.trim());
  };

  if (isLoading || !session) return (
    <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>
  );

  const other = session.initiatorId === user?.id ? session.target : session.initiator;
  const isInitiator = session.initiatorId === user?.id;
  const canSend = session.status === 'ACTIVE' && isInitiator && session.initiatorMsgCount < 5;
  const canReply = session.status === 'WAITING' && !isInitiator;
  const inputEnabled = canSend || canReply;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate('/app/rizz')} className="text-text-muted hover:text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <Avatar src={other.avatarUrl} name={other.name} size={36} />
        <div className="flex-1">
          <p className="font-semibold text-text-primary">{other.name}</p>
          <p className="text-xs text-text-muted">{other.collegeName ?? ''}</p>
        </div>
        <button onClick={loadIcebreaker} className="text-text-muted hover:text-primary transition-colors" title="Get icebreaker tip">
          <Lightbulb size={18} />
        </button>
      </div>

      {/* Progress bar */}
      <RizzBar count={session.initiatorMsgCount} status={session.status} />

      {/* Icebreaker tip */}
      {icebreaker && (
        <div className="mx-4 mt-3 bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm text-primary flex items-start gap-2">
          <Lightbulb size={14} className="shrink-0 mt-0.5" />
          <span>{icebreaker}</span>
          <button onClick={() => setIcebreaker(null)} className="ml-auto text-primary/60 hover:text-primary">✕</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {session.messages.map((msg: RizzMessage) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] sm:max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                  isMe ? 'bg-primary text-white rounded-br-sm' : 'bg-card border border-border text-text-primary rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-text-muted'}`}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        {session.status === 'ACCEPTED' && (
          <div className="text-center py-4">
            <p className="text-sm text-text-secondary mb-3">🎉 You're connected! Continue the conversation in Messages.</p>
            <button
              onClick={() => navigate('/app/messages')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors"
            >
              Continue in Messages →
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 pb-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!inputEnabled}
          placeholder={
            inputEnabled ? 'Type your message…' : 'You cannot send messages right now'
          }
          className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors disabled:opacity-50 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || !inputEnabled || sendMutation.isPending}
          className="bg-primary hover:bg-primary-light rounded-xl px-4 py-3 text-white transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
