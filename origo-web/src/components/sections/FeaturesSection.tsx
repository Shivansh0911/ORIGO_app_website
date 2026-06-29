import React, { useEffect, useRef, useState } from 'react';

const features = [
  {
    icon: '⚡',
    title: 'Rizz In 5',
    description: 'Send exactly 5 messages to make your first impression. Quality over quantity. No ghost-zoning, just real vibes.',
    accent: '#6C3DFF',
  },
  {
    icon: '🎓',
    title: 'Campus Verified',
    description: 'Your .edu email proves you\'re the real deal. No bots, no strangers — just verified students from your campus.',
    accent: '#10B981',
  },
  {
    icon: '🧠',
    title: 'Smart Compatibility',
    description: 'ML-powered matching based on interests, not just profile photos. We score your compatibility so you meet people who actually get you.',
    accent: '#F59E0B',
  },
  {
    icon: '🏘️',
    title: 'Interest Communities',
    description: 'Join groups built around what you love — tech, music, sports, startups, art, and more. Find your campus crew.',
    accent: '#FF6B9D',
  },
  {
    icon: '👫',
    title: 'Ship a Friend',
    description: 'Think two friends would be perfect together? Play matchmaker with the Ship feature. Help your campus besties find love.',
    accent: '#8B5CF6',
  },
  {
    icon: '🔒',
    title: 'Private by Default',
    description: 'Your data stays on campus. Full control over who sees what. We never sell your information or share it with third parties.',
    accent: '#10B981',
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 100);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      className="group relative rounded-xl p-6 border transition-all duration-500 cursor-default"
      style={{
        background: '#1A1A2E',
        borderColor: '#2A2A45',
        borderLeft: `2px solid ${feature.accent}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 30px ${feature.accent}22`;
        (e.currentTarget as HTMLDivElement).style.borderColor = feature.accent;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#2A2A45';
        (e.currentTarget as HTMLDivElement).style.borderLeftColor = feature.accent;
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
        style={{ background: `${feature.accent}18` }}
      >
        {feature.icon}
      </div>
      <h3 className="text-white font-semibold text-lg mb-2 font-poppins">{feature.title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
    </div>
  );
}

export default function FeaturesSection() {
  const [titleVisible, setTitleVisible] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTitleVisible(true); },
      { threshold: 0.1 }
    );
    if (titleRef.current) observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 bg-bg relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(108,61,255,0.08) 0%, transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto px-6">
        {/* Section heading */}
        <div
          ref={titleRef}
          className="text-center mb-16"
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'rgba(108,61,255,0.15)', color: '#8B5CF6' }}
          >
            FEATURES
          </div>
          <h2 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-4">
            Why <span className="gradient-text">Origo?</span>
          </h2>
          <div className="w-20 h-1 mx-auto rounded-full mb-6" style={{ background: 'linear-gradient(90deg, #6C3DFF, #FF6B9D)' }} />
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            We built every feature with one goal: to make genuine campus connections easier, safer, and more fun.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
