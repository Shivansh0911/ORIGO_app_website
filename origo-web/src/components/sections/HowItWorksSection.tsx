import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    number: '01',
    icon: '🎓',
    title: 'Create Your Profile',
    description: 'Sign up with your college email and pick your interests. Your .edu email verifies you\'re a real student — no fakes allowed.',
    color: '#6C3DFF',
  },
  {
    number: '02',
    icon: '🧭',
    title: 'Discover Your People',
    description: 'Swipe through verified students matched to your vibe. Our ML engine scores compatibility based on what you love, not just how you look.',
    color: '#FF6B9D',
  },
  {
    number: '03',
    icon: '⚡',
    title: 'Rizz & Connect',
    description: 'Send 5 creative messages in 48 hours and see if the vibe is real. Quality over quantity — every word counts.',
    color: '#F59E0B',
  },
];

export default function HowItWorksSection() {
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
    <section ref={sectionRef} className="py-24 relative overflow-hidden" style={{ background: '#0F0F1A' }}>
      {/* Background decoration */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,107,157,0.06) 0%, transparent 70%)' }}
      />

      <div className="max-w-6xl mx-auto px-6">
        {/* Heading */}
        <div
          className="text-center mb-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'rgba(255,107,157,0.15)', color: '#FF6B9D' }}
          >
            HOW IT WORKS
          </div>
          <h2 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-4">
            Get connected in{' '}
            <span className="gradient-text">3 steps</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            From signup to your first real connection — it takes less than 5 minutes to get started.
          </p>
        </div>

        {/* Steps */}
        <div className="relative flex flex-col md:flex-row gap-8 md:gap-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex-1 relative">
              {/* Connector arrow (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:flex absolute top-10 -right-4 z-10 items-center justify-center w-8">
                  <div className="w-full h-0.5" style={{ background: 'linear-gradient(90deg, #2A2A45, #6C3DFF)' }} />
                  <div
                    className="absolute right-0 w-0 h-0"
                    style={{
                      borderTop: '5px solid transparent',
                      borderBottom: '5px solid transparent',
                      borderLeft: '8px solid #6C3DFF',
                    }}
                  />
                </div>
              )}

              <div
                className="rounded-2xl p-8 border h-full"
                style={{
                  background: '#1A1A2E',
                  borderColor: '#2A2A45',
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`,
                }}
              >
                {/* Number badge */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold font-poppins text-white mb-4"
                  style={{ background: step.color, boxShadow: `0 0 24px ${step.color}50` }}
                >
                  {step.number}
                </div>

                {/* Icon */}
                <div className="text-4xl mb-4">{step.icon}</div>

                {/* Content */}
                <h3 className="font-poppins font-bold text-xl text-white mb-3">{step.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{step.description}</p>

                {/* Step indicator line */}
                <div className="mt-6 h-1 rounded-full" style={{ background: `${step.color}30` }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: step.color,
                      width: visible ? '100%' : '0%',
                      transition: `width 0.8s ease ${index * 0.2 + 0.4}s`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="text-center mt-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease 0.6s, transform 0.6s ease 0.6s',
          }}
        >
          <p className="text-text-secondary mb-6 text-lg">
            Join thousands who found their campus tribe
          </p>
          <Link
            to="/download"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold font-poppins px-8 py-4 rounded-full text-base transition-all duration-200"
            style={{ boxShadow: '0 0 30px rgba(108,61,255,0.3)' }}
          >
            <span>🚀</span>
            Start Your Journey
          </Link>
        </div>
      </div>
    </section>
  );
}
