import React from 'react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-bg">
      {/* Radial gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6C3DFF 0%, transparent 70%)' }}
        />
        {/* Floating bubbles */}
        <div className="absolute top-20 left-10 w-16 h-16 rounded-full bg-primary/20 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-10 h-10 rounded-full bg-accent/20 animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-32 left-20 w-20 h-20 rounded-full bg-primary/10 animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-20 right-32 w-12 h-12 rounded-full bg-accent/15 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-60 left-1/4 w-8 h-8 rounded-full bg-primary/30 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/3 right-1/4 w-14 h-14 rounded-full bg-primary-light/20 animate-float" style={{ animationDelay: '2.5s' }} />
        {/* Grid dots */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #6C3DFF 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-16 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: Content */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 border"
              style={{
                background: 'rgba(108,61,255,0.12)',
                borderColor: 'rgba(108,61,255,0.4)',
                color: '#B0B0CC',
                boxShadow: '0 0 20px rgba(108,61,255,0.15)',
              }}
            >
              <span>🎓</span>
              <span>Exclusively for College Students</span>
            </div>

            {/* Headline */}
            <h1 className="font-poppins font-bold text-5xl md:text-6xl lg:text-7xl leading-tight mb-6">
              <span className="gradient-text">Meet. Belong.</span>
              <br />
              <span className="text-white">Connect.</span>
            </h1>

            {/* Subheading */}
            <p className="text-text-secondary text-lg md:text-xl leading-relaxed mb-8 max-w-lg">
              Origo connects Indian college students based on shared interests, not just location. Find your people, your tribe, your campus family.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                to="/download"
                className="bg-primary hover:bg-primary-light text-white font-semibold font-poppins px-8 py-4 rounded-full text-base transition-all duration-200 shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
              >
                <span>📱</span>
                Download App
              </Link>
              <Link
                to="/features"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold font-poppins px-8 py-4 rounded-full text-base transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>▶</span>
                See How It Works
              </Link>
            </div>

            {/* App Store Badges */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a
                href="#"
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-3 hover:border-primary transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current text-green" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.18 23.76c.33.18.72.18 1.08 0l11.5-6.64-2.59-2.59-10 9.23zM.5 1.05C.19 1.38 0 1.88 0 2.53v18.94c0 .65.19 1.15.5 1.48l.08.08 10.6-10.6v-.25L.58.97.5 1.05zM19.37 8.82l-2.94-1.7-2.91 2.91 2.91 2.9 2.95-1.7c.84-.49.84-1.28-.01-1.41zM4.26.24L15.76 6.88l-2.59 2.59L3.18.24C3.54.06 3.93.06 4.26.24z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-text-muted text-xs">Get it on</div>
                  <div className="text-white text-sm font-semibold font-poppins">Google Play</div>
                </div>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-3 hover:border-primary transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current text-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-text-muted text-xs">Download on the</div>
                  <div className="text-white text-sm font-semibold font-poppins">App Store</div>
                </div>
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['P', 'R', 'A', 'K'].map((initial, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-bg flex items-center justify-center text-xs font-bold font-poppins text-white"
                    style={{
                      background: ['#6C3DFF', '#FF6B9D', '#10B981', '#F59E0B'][i],
                    }}
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <p className="text-text-secondary text-sm">
                <span className="text-white font-semibold">10,000+</span> students across{' '}
                <span className="text-white font-semibold">150+</span> colleges
              </p>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Glow behind phone */}
              <div
                className="absolute inset-0 rounded-3xl blur-3xl opacity-40"
                style={{ background: 'linear-gradient(135deg, #6C3DFF, #FF6B9D)' }}
              />
              {/* Phone frame */}
              <div
                className="relative w-64 md:w-72 h-[540px] md:h-[580px] rounded-[40px] border-4 border-border shadow-2xl animate-float"
                style={{ background: '#0D0D14', borderColor: '#2A2A45' }}
              >
                {/* Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-border rounded-full" />

                {/* Screen content */}
                <div className="absolute top-12 left-3 right-3 bottom-6 rounded-[28px] overflow-hidden bg-card">
                  {/* App header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-white text-xs font-bold">O</span>
                      </div>
                      <span className="text-white text-xs font-semibold font-poppins">Origo</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted" />
                      <div className="w-6 h-6 rounded-full bg-muted" />
                    </div>
                  </div>

                  {/* Profile card mockup */}
                  <div className="p-3">
                    <div className="rounded-2xl overflow-hidden border border-border">
                      {/* Profile image area */}
                      <div
                        className="h-44 flex items-end p-3"
                        style={{ background: 'linear-gradient(180deg, #1A1A2E 0%, #6C3DFF33 100%)' }}
                      >
                        <div className="w-full">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">P</div>
                            <div>
                              <div className="text-white text-xs font-semibold">Priya S.</div>
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center">
                                  <span className="text-white text-[6px]">✓</span>
                                </div>
                                <span className="text-text-muted text-[10px]">IIT Delhi</span>
                              </div>
                            </div>
                            <div
                              className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(108,61,255,0.3)', color: '#8B5CF6' }}
                            >
                              94% match
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap mt-2">
                            {['Coding', 'Music', 'Startups'].map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(108,61,255,0.2)', color: '#B0B0CC' }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Rizz In 5 section */}
                      <div className="p-3 bg-muted">
                        <div className="text-text-muted text-[9px] mb-1.5 font-medium">RIZZ IN 5</div>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <div
                              key={n}
                              className="flex-1 h-1.5 rounded-full"
                              style={{
                                background: n <= 2 ? '#6C3DFF' : n === 3 ? '#8B5CF6' : '#2A2A45',
                              }}
                            />
                          ))}
                        </div>
                        <div className="text-text-secondary text-[10px]">2 of 5 messages sent</div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-3 justify-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg"
                        style={{ background: 'rgba(255,107,157,0.15)', border: '1px solid rgba(255,107,157,0.3)' }}
                      >
                        ✕
                      </div>
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-xl"
                        style={{ background: '#6C3DFF', boxShadow: '0 0 20px rgba(108,61,255,0.5)' }}
                      >
                        ⚡
                      </div>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg"
                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
                      >
                        ♥
                      </div>
                    </div>
                  </div>
                </div>

                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-border rounded-full" />
              </div>

              {/* Floating notification cards */}
              <div
                className="absolute -right-4 top-20 bg-card border border-border rounded-2xl px-3 py-2 shadow-xl animate-float"
                style={{ animationDelay: '1s', minWidth: '140px' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">R</div>
                  <div>
                    <div className="text-white text-[11px] font-semibold">Rahul liked you!</div>
                    <div className="text-text-muted text-[9px]">BITS Pilani • 91% match</div>
                  </div>
                </div>
              </div>

              <div
                className="absolute -left-4 bottom-28 bg-card border border-border rounded-2xl px-3 py-2 shadow-xl animate-float"
                style={{ animationDelay: '2s', minWidth: '150px' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  <div>
                    <div className="text-white text-[11px] font-semibold">It's a Match!</div>
                    <div className="text-text-muted text-[9px]">Start your Rizz In 5</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none">
        <svg viewBox="0 0 1440 80" className="w-full h-full" preserveAspectRatio="none">
          <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#1A1A2E" opacity="0.3" />
        </svg>
      </div>
    </section>
  );
}
