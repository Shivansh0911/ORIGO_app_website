import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { notificationsApi } from '../../api/endpoints';
import { useNotificationStore } from '../../store/notificationStore';
import type { Notification } from '../../types';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const TYPE_ICONS: Record<string, string> = {
  MATCH_REQUEST: '💕',
  MATCH_ACCEPTED: '🎉',
  RIZZ_MESSAGE: '⚡',
  RIZZ_UNLOCKED: '🔓',
  SHIP_RECEIVED: '🚀',
  COMMUNITY_POST: '📝',
  DEFAULT: '🔔',
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const reset = useNotificationStore((s) => s.reset);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
  });

  const notifications: Notification[] = data ?? [];

  // Reset badge when page is opened
  useEffect(() => { reset(); }, [reset]);

  const markOne = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      reset();
      toast.success('All marked as read');
    },
  });

  const unread = notifications.filter((n) => !n.isRead);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Notifications</h1>
          {unread.length > 0 && (
            <span className="bg-accent text-white text-xs rounded-full px-1.5 py-0.5">{unread.length}</span>
          )}
        </div>
        {unread.length > 0 && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : notifications.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications" description="You're all caught up!" />
        ) : (
          <div className="p-3 space-y-1">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.isRead && markOne.mutate(n.id)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-colors ${n.isRead ? 'opacity-60 hover:bg-primary/10' : 'bg-primary/5 hover:bg-primary/10'}`}
              >
                <span className="text-xl mt-0.5">{TYPE_ICONS[n.type] ?? TYPE_ICONS.DEFAULT}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{n.title}</p>
                  <p className="text-sm text-text-muted mt-0.5">{n.body}</p>
                  <p className="text-xs text-text-muted mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
