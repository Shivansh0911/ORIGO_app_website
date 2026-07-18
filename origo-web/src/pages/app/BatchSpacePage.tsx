import { MessageSquare, Users, MapPin, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFreshersStore } from '../../store/freshersStore';
import { BATCH_INFO } from '../../lib/freshers/content';
import { track } from '../../lib/telemetry';

export default function BatchSpacePage() {
  const { batchJoined, joinBatch } = useFreshersStore();

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="relative overflow-hidden rounded-3xl border border-border p-8 mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(108,61,255,0.2))' }}>
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-black/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">🎓 PRE-ARRIVAL</div>
          <h1 className="text-3xl font-bold text-white mb-1">{BATCH_INFO.name}</h1>
          <p className="text-white/80 text-sm max-w-md">Your incoming batch, before day one. Find people from your city, sort roommate vibes, and ask seniors what to actually pack.</p>
          <div className="flex gap-5 mt-4 text-white/90 text-sm">
            <span className="flex items-center gap-1.5"><Users size={15} /> {BATCH_INFO.members + (batchJoined ? 1 : 0)} members</span>
            <span className="flex items-center gap-1.5"><MapPin size={15} /> {BATCH_INFO.cities} cities</span>
          </div>
        </div>
      </div>

      {!batchJoined ? (
        <button
          onClick={() => { joinBatch(); track('batch_joined'); track('quest_completed', { questId: 'batch' }); toast.success("Welcome to the Batch of '30 🎓"); }}
          className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-light text-white font-semibold transition-colors mb-6"
        >
          Join your batch space
        </button>
      ) : (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-green/10 border border-green/30 mb-6">
          <div className="w-9 h-9 rounded-full bg-green/20 flex items-center justify-center"><Check size={16} className="text-green" /></div>
          <p className="text-text-primary text-sm font-medium">You’re in. Jump into a thread below.</p>
        </div>
      )}

      <h2 className="text-lg font-bold text-text-primary mb-3">Threads</h2>
      <div className="space-y-2">
        {BATCH_INFO.threads.map((t) => (
          <button
            key={t.id}
            onClick={() => toast(batchJoined ? 'Opening thread…' : 'Join the batch to reply', { icon: t.emoji })}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">{t.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium truncate">{t.title}</p>
              <p className="text-text-muted text-xs flex items-center gap-1"><MessageSquare size={12} /> {t.replies} replies</p>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-text-muted mt-6 text-center">
        Batch spaces run on Origo Communities — same threads, events, and moderation, packaged for your intake year.
      </p>
    </div>
  );
}
