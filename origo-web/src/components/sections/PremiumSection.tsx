import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const premiumFeatures = [
  'Unlimited Rizz sessions daily',
  'Cross-campus discovery',
  'See who liked you',
  'Profile Boost (3x visibility)',
  'Read receipts',
  'Priority matching',
];

const plans = [
  {
    label: 'Monthly',
    price: '₹99',
    per: '/mo',
    subtitle: 'Billed monthly',
    savings: null,
    highlighted: false,
  },
  {
    label: 'Quarterly',
    price: '₹83',
    per: '/mo',
    subtitle: 'Billed ₹249 every 3 months',
    savings: 'Save 16%',
    highlighted: true,
  },
  {
    label: 'Annual',
    price: '₹67',
    per: '/mo',
    subtitle: 'Billed ₹799 every year',
    savings: 'Save 32%',
    highlighted: false,
  },
];

export default function PremiumSection() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="premium" className="py-24 bg-bg relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none opacity-15"
        style={{ background: 'radial-gradient(circle, #6C3DFF 0%, transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto px-6">
        <div
          className="rounded-3xl overflow-hidden border relative"
          style={{
            borderColor: 'rgba(108,61,255,0.3)',
            background: 'linear-gradient(135deg, rgba(108,61,255,0.15) 0%, rgba(26,26,46,0.95) 50%, rgba(255,107,157,0.08) 100%)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          {/* Decorative orb */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-30 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #6C3DFF, transparent)' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #FF6B9D, transparent)' }}
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: Features */}
            <div className="p-10 lg:p-14">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}
              >
                ✨ PREMIUM
              </div>
              <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-3">
                Go Premium{' '}
                <span className="text-3xl">✨</span>
              </h2>
              <p className="text-text-secondary mb-8 leading-relaxed">
                Unlock the full Origo experience and maximize your campus connections with exclusive features.
              </p>

              <ul className="space-y-4">
                {premiumFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(108,61,255,0.25)', border: '1px solid rgba(108,61,255,0.5)' }}
                    >
                      <span className="text-primary text-xs font-bold">✓</span>
                    </div>
                    <span className="text-text-secondary text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 p-4 rounded-xl border" style={{ borderColor: 'rgba(108,61,255,0.2)', background: 'rgba(108,61,255,0.08)' }}>
                <div className="flex items-center gap-2 text-text-secondary text-sm">
                  <span>🎓</span>
                  <span>Student-friendly pricing — no hidden costs, cancel anytime.</span>
                </div>
              </div>
            </div>

            {/* Right: Pricing cards */}
            <div className="p-10 lg:p-14 lg:border-l border-t lg:border-t-0" style={{ borderColor: 'rgba(42,42,69,0.5)' }}>
              <h3 className="font-poppins font-semibold text-white text-xl mb-6">Choose your plan</h3>

              <div className="space-y-4">
                {plans.map((plan) => (
                  <div
                    key={plan.label}
                    className="relative rounded-2xl p-5 border cursor-pointer transition-all duration-200"
                    style={{
                      background: plan.highlighted ? 'rgba(108,61,255,0.2)' : 'rgba(26,26,46,0.6)',
                      borderColor: plan.highlighted ? '#6C3DFF' : '#2A2A45',
                      boxShadow: plan.highlighted ? '0 0 24px rgba(108,61,255,0.3)' : 'none',
                    }}
                  >
                    {plan.highlighted && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold font-poppins text-white"
                        style={{ background: '#6C3DFF' }}
                      >
                        Most Popular
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold font-poppins">{plan.label}</div>
                        <div className="text-text-muted text-xs mt-0.5">{plan.subtitle}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-baseline gap-0.5">
                          <span
                            className="font-bold text-2xl font-poppins"
                            style={{ color: plan.highlighted ? '#FFFFFF' : '#B0B0CC' }}
                          >
                            {plan.price}
                          </span>
                          <span className="text-text-muted text-sm">{plan.per}</span>
                        </div>
                        {plan.savings && (
                          <div
                            className="text-xs font-semibold mt-0.5"
                            style={{ color: '#10B981' }}
                          >
                            {plan.savings}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/download"
                className="mt-8 w-full flex items-center justify-center gap-2 text-white font-semibold font-poppins py-4 rounded-2xl transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #6C3DFF, #FF6B9D)',
                  boxShadow: '0 0 30px rgba(108,61,255,0.4)',
                }}
              >
                <span>🚀</span>
                Start Free Trial
              </Link>
              <p className="text-center text-text-muted text-xs mt-3">
                7-day free trial · No credit card required
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
