import React from 'react';

const VALUES = [
  { emoji: '🔒', title: 'Authenticity', desc: 'Every profile is tied to a real college email. No catfishing, no bots — just real students.' },
  { emoji: '🛡️', title: 'Safety', desc: 'Built-in reporting, blocking, and moderation tools keep the community safe for everyone.' },
  { emoji: '🏘️', title: 'Community', desc: 'Origo is built around shared interests, not just geography. Find your real tribe.' },
  { emoji: '🔐', title: 'Privacy', desc: 'You control who sees what. Your data is yours — encrypted and never sold.' },
];

const TEAM = [
  { name: 'Aryan Agrawal', role: 'CEO & Co-founder', initials: 'AA', desc: 'Building for India\'s 40M college students.' },
  { name: 'Tech Lead', role: 'CTO & Co-founder', initials: 'TL', desc: 'Full-stack engineer, ex-top tech company.' },
  { name: 'Design Lead', role: 'CPO & Co-founder', initials: 'DL', desc: 'Product designer with a passion for social apps.' },
];

const TIMELINE = [
  { period: '2024 Q1', title: 'The Idea', desc: 'Frustrated with generic social apps that failed campus life, Origo was born.' },
  { period: '2024 Q3', title: 'Beta Launch', desc: 'Launched at 5 colleges in India with 500 early users.' },
  { period: '2025 Q1', title: '10K Students', desc: 'Reached 10,000 active users across 50+ colleges.' },
  { period: '2025 Q2', title: 'Premium Launch', desc: 'Launched Premium with cross-campus discovery and advanced features.' },
];

const COLLEGES = ['IIT Delhi', 'BITS Pilani', 'VIT Vellore', 'NIT Trichy', 'IIIT Hyderabad', 'DTU', 'Manipal', 'SRM', 'Amity', 'Christ University', 'NMIMS', 'Symbiosis'];

export default function AboutPage() {
  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6">
            <span>🚀</span>
            <span className="text-primary text-sm font-medium">Our Story</span>
          </div>
          <h1 className="text-5xl font-bold font-poppins text-white mb-6 leading-tight">
            Built for India's<br />
            <span className="gradient-text">Campus Generation</span>
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            We believe college years are the most formative — yet most people miss connections that
            could define their careers, friendships, and lives. Origo makes those connections intentional.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto bg-card border border-border rounded-3xl p-10 md:p-16">
          <div className="text-5xl mb-6 text-center">🎯</div>
          <h2 className="text-3xl font-bold font-poppins text-white text-center mb-6">Our Mission</h2>
          <p className="text-text-secondary text-lg leading-relaxed text-center max-w-2xl mx-auto">
            India has 40 million college students. Each one deserves a social experience that is
            verified, interest-driven, and built for campus life — not repurposed from a generic
            global app. Origo is the campus social layer that India has been waiting for.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold font-poppins text-white text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors">
                <div className="text-4xl mb-4">{v.emoji}</div>
                <h3 className="text-xl font-bold font-poppins text-white mb-2">{v.title}</h3>
                <p className="text-text-secondary leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-6 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-poppins text-white text-center mb-12">Our Story</h2>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-primary/10" />
            <div className="space-y-10">
              {TIMELINE.map((t, i) => (
                <div key={i} className="flex gap-6 pl-16 relative">
                  <div className="absolute left-3 top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ring-4 ring-bg">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-primary text-sm font-semibold mb-1">{t.period}</div>
                    <h3 className="text-white font-bold text-lg font-poppins mb-1">{t.title}</h3>
                    <p className="text-text-secondary">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold font-poppins text-white text-center mb-12">The Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-card border border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {member.initials}
                </div>
                <h3 className="text-white font-bold text-lg font-poppins mb-1">{member.name}</h3>
                <p className="text-primary text-sm font-medium mb-3">{member.role}</p>
                <p className="text-text-muted text-sm">{member.desc}</p>
                <div className="flex justify-center gap-3 mt-4">
                  {['in', 'tw'].map((s) => (
                    <a key={s} href="#" className="w-8 h-8 rounded-full bg-muted border border-border text-text-muted hover:text-white hover:border-primary flex items-center justify-center text-xs transition-colors">
                      {s}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus Partners */}
      <section className="py-16 px-6 bg-card/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-poppins text-white mb-4">Campus Partners</h2>
          <p className="text-text-secondary mb-10">Origo is live and growing at these institutions</p>
          <div className="flex flex-wrap justify-center gap-3">
            {COLLEGES.map((c) => (
              <span key={c} className="px-4 py-2 bg-card border border-border rounded-full text-text-secondary text-sm hover:border-primary hover:text-white transition-colors">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold font-poppins text-white mb-4">Join the Mission</h2>
        <p className="text-text-secondary mb-8">Be part of redefining campus social life in India.</p>
        <a href="/download" className="inline-flex bg-primary hover:bg-primary-light text-white font-semibold px-8 py-4 rounded-full transition-colors text-base">
          Download Origo
        </a>
      </section>
    </main>
  );
}
