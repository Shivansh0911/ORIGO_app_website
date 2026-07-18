import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { useFreshersStore } from '../../store/freshersStore';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';

const APP_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://origo.app';

export default function WeMetPage() {
  const user = useAuthStore((s) => s.user);
  const { met, removeMet } = useFreshersStore();
  const [qr, setQr] = useState('');

  const profileUrl = user ? `${APP_ORIGIN}/u/${user.username}` : APP_ORIGIN;

  useEffect(() => {
    QRCode.toDataURL(profileUrl, { margin: 1, width: 320, color: { dark: '#0D0D14', light: '#FFFFFF' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [profileUrl]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">🤝 WE MET</div>
        <h1 className="text-2xl font-bold text-text-primary">Meet now, remember later</h1>
        <p className="text-text-muted text-sm mt-1 max-w-xl">
          Orientation means meeting 50 people and forgetting all of them. Have someone scan your code —
          you’ll both land in each other’s “met” list, no follow request, no awkwardness.
        </p>
      </div>

      {/* Your QR */}
      <div className="flex flex-col items-center bg-card border border-border rounded-3xl p-8 mb-8">
        {qr ? (
          <img src={qr} alt="Your Origo QR" className="w-52 h-52 rounded-2xl bg-white p-2" />
        ) : (
          <div className="w-52 h-52 rounded-2xl bg-muted animate-pulse" />
        )}
        <p className="text-text-primary font-semibold mt-4">{user?.name}</p>
        <p className="text-text-muted text-sm">@{user?.username}</p>
        <p className="text-text-muted text-xs mt-3 text-center max-w-xs">
          Show this to someone you just met. Point their camera at it to connect.
        </p>
      </div>

      {/* Met list */}
      <h2 className="text-lg font-bold text-text-primary mb-3">People you’ve met</h2>
      {met.length === 0 ? (
        <EmptyState
          icon="👋"
          title="No one yet"
          description="Scan someone’s code during orientation and they’ll show up here."
        />
      ) : (
        <div className="space-y-2">
          {met.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card">
              <Avatar src={null} name={m.name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium text-sm truncate">{m.name}</p>
                <p className="text-text-muted text-xs truncate">
                  {m.where} · {formatDistanceToNow(new Date(m.at), { addSuffix: true })}
                </p>
              </div>
              <button onClick={() => removeMet(m.id)} className="text-text-muted hover:text-red-400 transition-colors" aria-label="Remove">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-text-muted mt-6 text-center">
        Live camera scanning uses the device camera and lands in the native app; on web, share your code link to connect.
      </p>
    </div>
  );
}
