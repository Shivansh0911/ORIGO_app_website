import React, { useEffect, useRef, useState } from 'react';

const stats = [
  { value: 10000, suffix: 'K+', display: '10K+', label: 'Students', description: 'Verified campus users' },
  { value: 150, suffix: '+', display: '150+', label: 'Colleges', description: 'Across India' },
  { value: 500, suffix: 'K+', display: '500K+', label: 'Rizz Messages', description: 'Meaningful connections' },
  { value: 95, suffix: '%', display: '95%', label: 'Match Rate', description: 'Verified satisfaction' },
];

function AnimatedNumber({ target, suffix, visible }: { target: number; suffix: string; visible: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCurrent(Math.min(Math.round(increment * step), target));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible, target]);

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return n.toString();
  };

  return (
    <span>
      {formatNumber(current)}{suffix}
    </span>
  );
}

export default function StatsSection() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(108,61,255,0.15) 0%, rgba(13,13,20,1) 50%, rgba(255,107,157,0.08) 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle, #6C3DFF 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`,
              }}
            >
              <div
                className="text-4xl md:text-5xl font-bold font-poppins mb-2"
                style={{
                  background: 'linear-gradient(135deg, #6C3DFF, #FF6B9D)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {visible ? (
                  <AnimatedNumber target={stat.value} suffix={stat.suffix} visible={visible} />
                ) : (
                  '0'
                )}
              </div>
              <div className="text-white font-semibold text-lg font-poppins mb-1">{stat.label}</div>
              <div className="text-text-muted text-sm">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          className="mt-12 h-px mx-auto max-w-2xl"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(108,61,255,0.4), transparent)' }}
        />
      </div>
    </section>
  );
}
