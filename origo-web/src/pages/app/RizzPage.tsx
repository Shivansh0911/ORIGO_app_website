import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Zap } from 'lucide-react';
import { rizzApi } from '../../api/endpoints';
import type { RizzSession } from '../../types';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: 'Active', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  WAITING:  { label: 'Waiting', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  UNLOCKED: { label: 'Unlocked 🎉', color: 'text-primary bg-primary/10 border-primary/20' },
  DECLINED: { label: 'Declined', color: 'text-text-muted bg-muted border-border' },
  EXPIRED:  { label: 'Expired', color: 'text-text-muted bg-muted border-border' },
};

function RizzProgressBar({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 w-6 rounded-full transition-all ${
            i < count
              ? i >= 3 ? 'bg-amber-400' : 'bg-primary'
              : 'bg-border'
          }`}
        />
      ))}
    </div>
  );
}

function SessionRow({ session, myId }: { session: RizzSession; myId: string }) {
  const other = session.initiatorId === myId ? session.receiver : session.initiator;
  const cfg = STATUS_CONFIG[session.status] ?? STATUS_CONFIG.ACTIVE;

  return (
    <Link
      to={`/app/rizz/${session.id}`}
      className="flex items-center gap-3 p-4 hover:bg-primary/10 rounded-xl transition-colors group"
    >
      <Avatar src={other.avatarUrl} name={other.name} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-medium text-text-primary truncate">{other.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
        </div>
        <RizzProgressBar count={session.messageCount} />
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-text-muted">{formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}</p>
        <p className="text-xs text-text-muted mt-0.5">{session.messageCount}/5 msgs</p>
      </div>
    </Link>
  );
}

export default function RizzPage() {
  const { user } = useAuthStore();
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['rizz-sessions'],
    queryFn: () => rizzApi.getSessions().then((r) => r.data),
    refetchInterval: 10000,
  });

  const active = sessions.filter((s) => s.status === 'ACTIVE' || s.status === 'WAITING');
  const past = sessions.filter((s) => !['ACTIVE', 'WAITING'].includes(s.status));

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Rizz In 5</h1>
        </div>
        <p className="text-text-muted text-sm mt-0.5">5 messages to make your first impression</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="No Rizz sessions yet"
            description="Go to Discover and send a Rizz to someone you like"
          />
        ) : (
          <div className="p-4 space-y-1">
            {active.length > 0 && (
              <>
                <p className="text-xs text-text-muted uppercase tracking-wider px-3 mb-2">Active</p>
                {active.map((s) => <SessionRow key={s.id} session={s} myId={user!.id} />)}
              </>
            )}
            {past.length > 0 && (
              <>
                <p className="text-xs text-text-muted uppercase tracking-wider px-3 mt-4 mb-2">Past</p>
                {past.map((s) => <SessionRow key={s.id} session={s} myId={user!.id} />)}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
