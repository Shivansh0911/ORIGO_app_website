import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { conversationsApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { useSocketStore } from '../../store/socketStore';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import type { Message } from '../../types';

// Common sticker packs (emoji-based, no assets needed)
const STICKER_PACKS: Record<string, string[]> = {
  Vibes: ['😂', '🔥', '💯', '👀', '🥺', '😭', '🤩', '✨', '💀', '🙏'],
  Campus: ['📚', '☕', '🎓', '🏫', '✏️', '💻', '🧑‍🎓', '📝', '🕐', '🎒'],
  Rizz: ['💕', '👋', '🫶', '😍', '🤙', '👊', '🫡', '💌', '🌹', '🫂'],
};

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [input, setInput] = useState('');
  const [stickerOpen, setStickerOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationsApi.getAll().then((r) => r.data.find((c) => c.id === conversationId)),
    enabled: !!conversationId,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationsApi.getMessages(conversationId!).then((r) => r.data),
    enabled: !!conversationId,
    refetchInterval: 3000,
  });

  const other = conversation?.participants.find((p) => p.id !== user?.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit('join-conversation', conversationId);
    socket.on('new-message', () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    });
    socket.on('typing', (data: { userId: string }) => {
      if (data.userId !== user?.id) { setTyping(true); setTimeout(() => setTyping(false), 2000); }
    });
    return () => { socket.off('new-message'); socket.off('typing'); };
  }, [socket, conversationId, user?.id, qc]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    socket?.emit('typing', { conversationId });
  };

  const sendMutation = useMutation({
    mutationFn: ({ content, type }: { content: string; type: string }) =>
      conversationsApi.sendMessage(conversationId!, content, type),
    onSuccess: () => {
      setInput('');
      setStickerOpen(false);
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => toast.error('Failed to send message'),
  });

  const send = (content: string, type = 'TEXT') => sendMutation.mutate({ content, type });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    send(input.trim());
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate('/app/messages')} className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        {other && (
          <>
            <Avatar src={other.avatarUrl} name={other.name} size={36} ring />
            <div className="flex-1">
              <p className="font-semibold text-text-primary">{other.name}</p>
              <p className="text-xs text-text-muted">
                {other.isVerified ? '✓ Verified · ' : ''}{other.collegeName ?? ''}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.map((msg: Message) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs ${
                  msg.type === 'STICKER'
                    ? 'text-4xl p-2'
                    : `px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-primary text-white rounded-br-sm'
                          : 'bg-card border border-border text-text-primary rounded-bl-sm'
                      }`
                }`}
              >
                <p>{msg.content}</p>
                {msg.type !== 'STICKER' && (
                  <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-text-muted'}`}>
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    {isMe && msg.readAt && ' · ✓'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="flex gap-1 pl-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sticker picker */}
      {stickerOpen && (
        <div className="border-t border-border bg-card p-3">
          {Object.entries(STICKER_PACKS).map(([pack, emojis]) => (
            <div key={pack} className="mb-3">
              <p className="text-xs text-text-muted mb-1.5">{pack}</p>
              <div className="flex flex-wrap gap-2">
                {emojis.map((e) => (
                  <button key={e} onClick={() => send(e, 'STICKER')} className="text-2xl hover:scale-110 transition-transform">
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2 flex gap-2 border-t border-border">
        <button
          type="button"
          onClick={() => setStickerOpen((o) => !o)}
          className={`p-3 rounded-xl border transition-colors ${stickerOpen ? 'border-primary text-primary bg-primary/10' : 'border-border text-text-muted hover:text-white'}`}
        >
          <Smile size={18} />
        </button>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message…"
          className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMutation.isPending}
          className="bg-primary hover:bg-primary-light rounded-xl px-4 py-3 text-white transition-colors disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
