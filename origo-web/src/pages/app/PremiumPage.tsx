import { useState } from 'react';
import { ArrowLeft, Check, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { paymentsApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';

// PSEUDO: Load Razorpay checkout script. Add this to index.html:
// <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
declare const Razorpay: new (options: Record<string, unknown>) => { open(): void };

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: 99, period: '/month', tag: null },
  { id: 'quarterly', label: 'Quarterly', price: 249, period: '/3 months', tag: 'Save 16%' },
  { id: 'annual', label: 'Annual', price: 799, period: '/year', tag: 'Best Value 🔥' },
];

const PERKS = [
  { icon: '🎯', title: 'Cross-campus Discovery', desc: 'Connect with people from other colleges' },
  { icon: '⚡', title: 'Unlimited Rizz Sessions', desc: 'Start as many sessions as you want' },
  { icon: '👁️', title: 'See Who Liked You', desc: 'Skip the guessing game' },
  { icon: '🚀', title: 'Profile Boost', desc: 'Appear at the top of discover for 24h' },
  { icon: '✨', title: 'Premium Badge', desc: 'Stand out with a premium profile badge' },
  { icon: '🎨', title: 'Profile Themes', desc: 'Customise your profile card aesthetic' },
];

export default function PremiumPage() {
  const [selected, setSelected] = useState('quarterly');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data } = await paymentsApi.createSubscriptionOrder(selected);
      const rz = new Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Origo Premium',
        description: `${PLANS.find((p) => p.id === selected)?.label} subscription`,
        prefill: { name: user?.name, email: '' },
        theme: { color: '#6C3DFF' },
        handler: async (response: Record<string, string>) => {
          await paymentsApi.verifyIap({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          toast.success('Premium activated! 🎉');
          navigate('/app/profile');
        },
      });
      rz.open();
    } catch {
      toast.error('Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <button onClick={() => navigate('/app/profile')} className="text-text-muted hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-text-primary">Origo Premium</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center py-4">
          <div className="text-5xl mb-3">✨</div>
          <h2 className="text-2xl font-bold text-text-primary">Unlock the full Origo</h2>
          <p className="text-text-muted text-sm mt-1">Go beyond your campus. Make real connections.</p>
        </div>

        {/* Plan selector */}
        <div className="space-y-3">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border transition-all text-left ${
                selected === plan.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 transition-all shrink-0 ${selected === plan.id ? 'border-primary bg-primary' : 'border-border'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-text-primary">{plan.label}</p>
                  {plan.tag && (
                    <span className="text-xs bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full">{plan.tag}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-text-primary">₹{plan.price}</p>
                <p className="text-xs text-text-muted">{plan.period}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Perks */}
        <div className="space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wider">What you get</p>
          {PERKS.map((perk) => (
            <div key={perk.title} className="flex items-center gap-3">
              <span className="text-xl">{perk.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{perk.title}</p>
                <p className="text-xs text-text-muted">{perk.desc}</p>
              </div>
              <Check size={16} className="text-green-400 shrink-0" />
            </div>
          ))}
        </div>

        {user?.isPremium ? (
          <div className="text-center py-4 bg-primary/10 border border-primary/20 rounded-2xl">
            <Star className="text-primary mx-auto mb-2" size={28} />
            <p className="font-semibold text-primary">You're already Premium!</p>
            <p className="text-text-muted text-sm mt-0.5">Enjoy all premium features.</p>
          </div>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-2xl transition-opacity disabled:opacity-60 text-base"
          >
            {loading ? 'Opening payment…' : `Subscribe · ₹${PLANS.find((p) => p.id === selected)?.price}`}
          </button>
        )}

        <p className="text-center text-xs text-text-muted pb-4">
          Payments secured by Razorpay · Cancel anytime
        </p>
      </div>
    </div>
  );
}
