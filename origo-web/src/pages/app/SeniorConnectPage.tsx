import { MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFreshersStore } from '../../store/freshersStore';
import { SENIORS } from '../../lib/freshers/content';

export default function SeniorConnectPage() {
  const completeQuest = useFreshersStore((s) => s.completeQuest);

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">🧭 SENIOR CONNECT</div>
        <h1 className="text-2xl font-bold text-text-primary">Ask a senior</h1>
        <p className="text-text-muted text-sm mt-1 max-w-xl">
          Your most urgent questions aren’t for other freshers — they’re for people who’ve been here.
          These verified seniors opted in to help. No question is too small.
        </p>
      </div>

      <div className="space-y-3">
        {SENIORS.map((s) => (
          <div key={s.id} className="p-5 rounded-2xl border border-border bg-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background: s.avatarColor }}>
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-text-primary font-semibold">{s.name}</p>
                  <span className="text-xs bg-green/15 text-green border border-green/30 px-2 py-0.5 rounded-full">Senior</span>
                </div>
                <p className="text-text-muted text-xs mb-2">{s.year} · {s.branch}</p>
                <p className="text-text-secondary text-sm mb-3">{s.blurb}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {s.topics.map((t) => (
                    <span key={t} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-full">{t}</span>
                  ))}
                </div>
                <button
                  onClick={() => { completeQuest('senior'); toast.success(`Question sent to ${s.name.split(' ')[0]} 🧭`); }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-light transition-colors"
                >
                  <MessageCircle size={15} /> Ask a question
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
