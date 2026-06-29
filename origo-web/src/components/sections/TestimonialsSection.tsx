import React, { useEffect, useRef, useState } from 'react';

const testimonials = [
  {
    quote: 'Finally found my coding partner and best friend all in one app! I wasn\'t expecting Origo to be this real — no fake profiles, just genuine people.',
    name: 'Priya S.',
    college: 'IIT Delhi',
    initial: 'P',
    color: '#6C3DFF',
    role: 'Computer Science, 3rd Year',
  },
  {
    quote: 'The Rizz In 5 mechanic is genius. So much more meaningful than regular DMs. It forces you to actually think about what you want to say.',
    name: 'Rahul M.',
    college: 'BITS Pilani',
    initial: 'R',
    color: '#FF6B9D',
    role: 'Electronics & Comm, 2nd Year',
  },
  {
    quote: 'Origo feels like it was built specifically for us. The campus verification is a game-changer. I feel safe knowing everyone is a real student.',
    name: 'Ananya K.',
    college: 'VIT Vellore',
    initial: 'A',
    color: '#10B981',
    role: 'MBA, 1st Year',
  },
];

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-amber text-lg">★</span>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const [visible, setVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll on mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-bg relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, #6C3DFF 0%, transparent 70%)' }}
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
            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
          >
            TESTIMONIALS
          </div>
          <h2 className="font-poppins font-bold text-4xl md:text-5xl text-white mb-4">
            What students are{' '}
            <span className="gradient-text">saying</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Real stories from real students who found their people on Origo.
          </p>
        </div>

        {/* Desktop: 3-column grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <div
              key={t.name}
              className="rounded-2xl p-7 border relative"
              style={{
                background: 'rgba(26, 26, 46, 0.6)',
                backdropFilter: 'blur(12px)',
                borderColor: '#2A2A45',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(30px)',
                transition: `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`,
              }}
            >
              {/* Quote mark */}
              <div
                className="absolute top-5 right-6 text-5xl font-bold opacity-20 font-poppins leading-none"
                style={{ color: t.color }}
              >
                "
              </div>

              <StarRating />

              <p className="text-text-secondary text-sm leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold font-poppins text-base flex-shrink-0"
                  style={{ background: t.color, boxShadow: `0 0 16px ${t.color}50` }}
                >
                  {t.initial}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm font-poppins">{t.name}</div>
                  <div className="text-text-muted text-xs">{t.college}</div>
                  <div className="text-text-muted text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Single card with dots */}
        <div className="md:hidden">
          <div
            className="rounded-2xl p-7 border relative"
            style={{
              background: 'rgba(26, 26, 46, 0.6)',
              backdropFilter: 'blur(12px)',
              borderColor: '#2A2A45',
              minHeight: '260px',
              transition: 'opacity 0.3s ease',
            }}
          >
            <div
              className="absolute top-5 right-6 text-5xl font-bold opacity-20 font-poppins leading-none"
              style={{ color: testimonials[activeIndex].color }}
            >
              "
            </div>

            <StarRating />

            <p className="text-text-secondary text-sm leading-relaxed mb-6 italic">
              "{testimonials[activeIndex].quote}"
            </p>

            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold font-poppins text-base flex-shrink-0"
                style={{ background: testimonials[activeIndex].color }}
              >
                {testimonials[activeIndex].initial}
              </div>
              <div>
                <div className="text-white font-semibold text-sm font-poppins">{testimonials[activeIndex].name}</div>
                <div className="text-text-muted text-xs">{testimonials[activeIndex].college}</div>
                <div className="text-text-muted text-xs">{testimonials[activeIndex].role}</div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === activeIndex ? '24px' : '8px',
                  height: '8px',
                  background: i === activeIndex ? '#6C3DFF' : '#2A2A45',
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom social proof bar */}
        <div
          className="mt-16 rounded-2xl p-6 border flex flex-col md:flex-row items-center justify-between gap-4"
          style={{
            background: 'rgba(108,61,255,0.08)',
            borderColor: 'rgba(108,61,255,0.2)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.6s ease 0.5s',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">⭐</span>
            <div>
              <div className="text-white font-bold text-2xl font-poppins">4.8 / 5</div>
              <div className="text-text-muted text-sm">Average Rating</div>
            </div>
          </div>
          <div className="w-px h-12 bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-white font-bold text-2xl font-poppins">10,000+</div>
            <div className="text-text-muted text-sm">Active Students</div>
          </div>
          <div className="w-px h-12 bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-white font-bold text-2xl font-poppins">150+</div>
            <div className="text-text-muted text-sm">Partner Colleges</div>
          </div>
          <div className="w-px h-12 bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-white font-bold text-2xl font-poppins">97%</div>
            <div className="text-text-muted text-sm">Would Recommend</div>
          </div>
        </div>
      </div>
    </section>
  );
}
