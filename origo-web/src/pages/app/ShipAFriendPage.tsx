import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { shipsApi, paymentsApi } from '../../api/endpoints';
import type { PublicUser } from '../../types';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';

// PSEUDO: Razorpay must be loaded — see PremiumPage note
declare const Razorpay: new (options: Record<string, unknown>) => { open(): void };

export default function ShipAFriendPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['ship-targets'],
    queryFn: () => shipsApi.getEligibleTargets().then((r) => r.data),
  });

  const shipMutation = useMutation({
    mutationFn: (paymentId: string) => {
      const [t1, t2] = Array.from(selected);
      return shipsApi.create({ targetOneId: t1, targetTwoId: t2, message: hint || undefined });
    },
    onSuccess: () => {
      toast.success('Ship sent anonymously! 💕');
      navigate('/app/profile');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? 'Ship failed');
    },
  });

  const toggleSelect = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) { n.delete(id); }
    else if (n.size < 2) { n.add(id); }
    else { toast('You can only pick 2 people'); return; }
    setSelected(n);
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      const { data } = await paymentsApi.createShipOrder();
      const rz = new Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Origo — Ship a Friend',
        description: 'Anonymous ship suggestion · ₹19',
        theme: { color: '#FF6B9D' },
        handler: async (resp: Record<string, string>) => {
          await paymentsApi.verifyIap({ orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature });
          shipMutation.mutate(resp.razorpay_payment_id);
        },
      });
      rz.open();
    } catch {
      toast.error('Payment failed. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  const [t1Id, t2Id] = Array.from(selected);
  const t1 = targets.find((t) => t.id === t1Id);
  const t2 = targets.find((t) => t.id === t2Id);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate('/app/profile')} className="text-text-muted hover:text-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Ship a Friend</h1>
          <p className="text-text-muted text-sm">Secretly suggest a match · ₹19</p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Selected preview */}
        <div className="flex items-center justify-center gap-4 py-4">
          <div className="flex flex-col items-center gap-1">
            {t1 ? <Avatar src={t1.avatarUrl} name={t1.name} size={60} ring /> : <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center text-2xl">?</div>}
            <p className="text-xs text-text-muted">{t1?.name ?? 'Person 1'}</p>
          </div>
          <Heart size={24} className="text-accent animate-pulse" />
          <div className="flex flex-col items-center gap-1">
            {t2 ? <Avatar src={t2.avatarUrl} name={t2.name} size={60} ring /> : <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center text-2xl">?</div>}
            <p className="text-xs text-text-muted">{t2?.name ?? 'Person 2'}</p>
          </div>
        </div>

        {/* Hint */}
        <div>
          <label className="text-sm text-text-secondary font-medium block mb-1">Anonymous hint (optional)</label>
          <textarea
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="They have so much in common…"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors resize-none text-sm"
          />
          <p className="text-xs text-text-muted text-right mt-0.5">{hint.length}/200</p>
        </div>

        {/* Friend grid */}
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Pick 2 from your matches</p>
          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : targets.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-4">You need at least 2 matches to ship people</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {targets.map((u: PublicUser) => (
                <button
                  key={u.id}
                  onClick={() => toggleSelect(u.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                    selected.has(u.id)
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent/40 bg-card'
                  }`}
                >
                  <Avatar src={u.avatarUrl} name={u.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{u.name}</p>
                    <p className="text-xs text-text-muted truncate">@{u.username}</p>
                  </div>
                  {selected.has(u.id) && <div className="w-4 h-4 rounded-full bg-accent shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handlePay}
          disabled={selected.size < 2 || processing || shipMutation.isPending}
          className="w-full py-3.5 bg-gradient-to-r from-accent to-primary text-white font-bold rounded-2xl transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Heart size={18} />
          {processing ? 'Opening payment…' : 'Ship Them · ₹19'}
        </button>
        <p className="text-center text-xs text-text-muted">Your identity stays anonymous · Powered by Razorpay</p>
      </div>
    </div>
  );
}
