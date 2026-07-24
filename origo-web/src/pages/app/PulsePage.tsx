import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Radio, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { pulseApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import PulseCard from '../../components/pulse/PulseCard';
import CreatePulseSheet from '../../components/pulse/CreatePulseSheet';
import type { PulseCategory } from '../../types';

export default function PulsePage() {
  const [showCreate, setShowCreate] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: feed = [], isLoading } = useQuery({
    queryKey: ['pulse-feed'],
    queryFn: () => pulseApi.getFeed().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: myPulse } = useQuery({
    queryKey: ['pulse-mine'],
    queryFn: () => pulseApi.getMine().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: { category: PulseCategory; text: string; vibe?: string }) =>
      pulseApi.create(body),
    onSuccess: () => {
      toast.success('Pulse sent to your campus!');
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ['pulse-feed'] });
      qc.invalidateQueries({ queryKey: ['pulse-mine'] });
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to post pulse');
    },
  });

  const respondMutation = useMutation({
    mutationFn: (pulseId: string) => pulseApi.respond(pulseId),
    onSuccess: () => {
      toast.success("You're in! The author will be notified.");
      qc.invalidateQueries({ queryKey: ['pulse-feed'] });
      setRespondingId(null);
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to respond');
      setRespondingId(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (pulseId: string) => pulseApi.cancel(pulseId),
    onSuccess: () => {
      toast.success('Pulse cancelled');
      qc.invalidateQueries({ queryKey: ['pulse-feed'] });
      qc.invalidateQueries({ queryKey: ['pulse-mine'] });
    },
    onError: () => toast.error('Failed to cancel'),
  });

  const handleRespond = (pulseId: string) => {
    setRespondingId(pulseId);
    respondMutation.mutate(pulseId);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Radio size={22} className="text-primary" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">Pulse</h1>
            <p className="text-xs text-text-muted">Right-now asks from your campus</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!!myPulse}
          title={myPulse ? 'You already have an active Pulse' : 'Create a Pulse'}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-light disabled:opacity-50 transition-colors"
        >
          <Plus size={16} />
          New Pulse
        </button>
      </div>

      {/* Active pulse notice */}
      {myPulse && (
        <div className="mb-4 bg-primary/5 border border-primary/20 rounded-2xl p-3 text-sm text-primary font-medium">
          You have an active Pulse. Cancel it to post a new one.
        </div>
      )}

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 h-32 animate-pulse" />
          ))}
        </div>
      ) : feed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Radio size={40} className="text-border mb-3" />
          <p className="text-text-secondary font-medium">No pulses yet</p>
          <p className="text-text-muted text-sm mt-1">Be the first to send one to your campus!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((pulse) => (
            <PulseCard
              key={pulse.id}
              pulse={pulse}
              onRespond={handleRespond}
              responding={respondingId === pulse.id}
              isOwn={pulse.authorId === user?.id}
              onCancel={(id) => cancelMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePulseSheet
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          loading={createMutation.isPending}
        />
      )}
    </div>
  );
}
