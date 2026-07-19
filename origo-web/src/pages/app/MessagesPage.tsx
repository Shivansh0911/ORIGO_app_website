import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';
import { conversationsApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import type { Conversation } from '../../types';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

function ConvRow({ conv, myId }: { conv: Conversation; myId: string }) {
  const other = conv.participants.find((p) => p.id !== myId);
  if (!other) return null;

  return (
    <Link
      to={`/app/messages/${conv.id}`}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-primary/10 rounded-xl transition-colors"
    >
      <Avatar src={other.avatarUrl} name={other.name} size={46} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-text-primary truncate">{other.name}</p>
          {conv.lastMessage && (
            <p className="text-xs text-text-muted shrink-0">
              {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
            </p>
          )}
        </div>
        <p className="text-sm text-text-muted truncate mt-0.5">
          {conv.lastMessage?.content ?? 'No messages yet'}
        </p>
      </div>
      {conv.unreadCount > 0 && (
        <span className="bg-primary text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center shrink-0">
          {conv.unreadCount}
        </span>
      )}
    </Link>
  );
}

export default function MessagesPage() {
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.getAll().then((r) => r.data),
    refetchInterval: 5000,
  });

  const filtered = conversations.filter((c) => {
    const other = c.participants.find((p) => p.id !== user?.id);
    return other?.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle size={20} className="text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Messages</h1>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No conversations yet"
            description="When someone accepts your match, you can chat here"
          />
        ) : (
          filtered.map((c) => <ConvRow key={c.id} conv={c} myId={user!.id} />)
        )}
      </div>
    </div>
  );
}
