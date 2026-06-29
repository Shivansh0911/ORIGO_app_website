import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

function useVisible() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function SectionWrapper({ children, reverse = false }: { children: React.ReactNode; reverse?: boolean }) {
  const { ref, visible } = useVisible();
  return (
    <div
      ref={ref}
      className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center py-20 border-b border-border`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {children}
    </div>
  );
}

function MockupBox({ children, accent = '#6C3DFF' }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="flex-1 rounded-3xl p-8 border relative overflow-hidden flex-shrink-0"
      style={{
        background: '#1A1A2E',
        borderColor: '#2A2A45',
        minHeight: '340px',
      }}
    >
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}, transparent)` }}
      />
      {children}
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <main className="bg-bg pt-20">
      {/* Hero */}
      <section className="relative py-24 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, rgba(108,61,255,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-4xl mx-auto px-6">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(108,61,255,0.15)', color: '#8B5CF6' }}
          >
            ALL FEATURES
          </div>
          <h1 className="font-poppins font-bold text-4xl md:text-6xl text-white mb-6 leading-tight">
            Everything you need to{' '}
            <span className="gradient-text">connect on campus</span>
          </h1>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto leading-relaxed">
            Origo is designed from the ground up for Indian college students. Every feature is built with authenticity, safety, and fun in mind.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6">

        {/* Section 1: Identity & Trust */}
        <SectionWrapper>
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
            >
              🎓 IDENTITY & TRUST
            </div>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-5">
              100% Campus Verified
            </h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Every person you meet on Origo is a real, verified student. No catfishing, no strangers from the internet — just your campus community.
            </p>
            <div className="space-y-4">
              {[
                { icon: '📧', title: 'College Email Verification', desc: 'Sign up with your .edu.in or .ac.in email. We send a verification link instantly.' },
                { icon: '🪪', title: 'Student ID Upload (Optional)', desc: 'Upload your student ID for an extra verification badge that builds trust.' },
                { icon: '✅', title: 'Verified Badge System', desc: 'Verified profiles show a blue checkmark so you always know who\'s real.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.12)' }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm font-poppins">{item.title}</div>
                    <div className="text-text-secondary text-sm mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <MockupBox accent="#10B981">
            <div className="space-y-4">
              <div className="text-text-muted text-xs font-semibold uppercase mb-6">Verification Flow</div>
              {[
                { step: '1', text: 'Enter your college email', done: true },
                { step: '2', text: 'Click the verification link', done: true },
                { step: '3', text: 'Upload student ID (optional)', done: false },
                { step: '4', text: 'Verified badge unlocked!', done: false, special: true },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-center gap-4 p-4 rounded-xl border"
                  style={{
                    borderColor: item.special ? 'rgba(16,185,129,0.4)' : '#2A2A45',
                    background: item.special ? 'rgba(16,185,129,0.08)' : 'rgba(22,33,62,0.6)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-poppins flex-shrink-0"
                    style={{
                      background: item.done ? '#10B981' : item.special ? '#10B98133' : '#2A2A45',
                      color: '#fff',
                    }}
                  >
                    {item.done ? '✓' : item.step}
                  </div>
                  <span className={`text-sm ${item.special ? 'text-green font-semibold' : 'text-text-secondary'}`}>{item.text}</span>
                  {item.special && <span className="ml-auto text-lg">✅</span>}
                </div>
              ))}
              <div
                className="mt-4 p-4 rounded-xl text-center"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}
              >
                <div className="text-2xl mb-1">🎓</div>
                <div className="text-green font-semibold text-sm font-poppins">Campus Verified</div>
                <div className="text-text-muted text-xs mt-1">IIT Delhi · 3rd Year CSE</div>
              </div>
            </div>
          </MockupBox>
        </SectionWrapper>

        {/* Section 2: Rizz In 5 */}
        <SectionWrapper reverse>
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(108,61,255,0.15)', color: '#8B5CF6' }}
            >
              ⚡ THE RIZZ IN 5 MECHANIC
            </div>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-5">
              5 Messages. Real Impressions.
            </h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Forget endless scrolling and one-word replies. Rizz In 5 gives you exactly 5 messages to make a real first impression. Quality, not quantity.
            </p>
            <div className="space-y-4">
              {[
                { icon: '⏱️', title: '48-Hour Window', desc: 'Once matched, you have 48 hours to send all 5 messages. Don\'t let it expire!' },
                { icon: '🔓', title: 'Unlock System', desc: 'Both users can only send 5 messages each. Every message costs a "rizz token".' },
                { icon: '💬', title: 'Reply Mechanic', desc: 'If they reply before you\'ve used all 5, you both open a full chat automatically.' },
                { icon: '🎯', title: 'No Ghosting Allowed', desc: 'The 48h timer ensures closure. No leaving people hanging forever.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(108,61,255,0.12)' }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm font-poppins">{item.title}</div>
                    <div className="text-text-secondary text-sm mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <MockupBox accent="#6C3DFF">
            <div className="space-y-5">
              <div className="text-text-muted text-xs font-semibold uppercase">Rizz In 5 — Active Session</div>

              {/* Profile row */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold font-poppins">P</div>
                <div>
                  <div className="text-white font-semibold text-sm">Priya S.</div>
                  <div className="text-text-muted text-xs">IIT Delhi · 94% match</div>
                </div>
                <div
                  className="ml-auto text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}
                >
                  47h left
                </div>
              </div>

              {/* 5-segment bar */}
              <div>
                <div className="flex gap-1.5 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="flex-1 h-2.5 rounded-full relative"
                      style={{ background: n <= 3 ? '#6C3DFF' : '#2A2A45' }}
                    >
                      {n <= 3 && (
                        <div
                          className="absolute inset-0 rounded-full opacity-50"
                          style={{ background: 'linear-gradient(90deg, #6C3DFF, #8B5CF6)' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>3 of 5 sent</span>
                  <span>2 remaining</span>
                </div>
              </div>

              {/* Chat messages */}
              <div className="space-y-2">
                {[
                  { text: 'Hey! Loved your interest in competitive programming 🚀', mine: true },
                  { text: 'Haha thanks! Are you in any coding clubs?', mine: false },
                  { text: 'Yeah I lead the DSA club at my college! We do weekly contests', mine: true },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="rounded-2xl px-4 py-2 text-xs max-w-[80%]"
                      style={{
                        background: msg.mine ? '#6C3DFF' : '#2A2A45',
                        color: '#fff',
                        borderBottomRightRadius: msg.mine ? '4px' : '16px',
                        borderBottomLeftRadius: msg.mine ? '16px' : '4px',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div
                className="flex items-center gap-2 p-3 rounded-xl border"
                style={{ borderColor: '#2A2A45', background: '#16213E' }}
              >
                <span className="text-text-muted text-xs flex-1">Write message 4 of 5...</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ background: '#6C3DFF' }}
                >
                  ⚡
                </div>
              </div>
            </div>
          </MockupBox>
        </SectionWrapper>

        {/* Section 3: Smart Discovery */}
        <SectionWrapper>
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}
            >
              🧠 SMART DISCOVERY
            </div>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-5">
              ML-Powered Matching
            </h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Our compatibility engine analyzes your interests, activity patterns, and engagement to surface the people you'll actually connect with.
            </p>
            <div className="space-y-4">
              {[
                { icon: '🎯', title: 'Compatibility Score', desc: 'Every profile shows a 0–100% compatibility score based on shared interests and personality signals.' },
                { icon: '🔄', title: 'Smart Swipe Mechanic', desc: 'Swipe right to start a Rizz session, left to skip. Super-like to jump the queue.' },
                { icon: '📊', title: 'Interest Graph', desc: 'The more you engage, the smarter your recommendations get. Your feed improves daily.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.12)' }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm font-poppins">{item.title}</div>
                    <div className="text-text-secondary text-sm mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <MockupBox accent="#F59E0B">
            <div className="space-y-4">
              <div className="text-text-muted text-xs font-semibold uppercase">Compatibility Breakdown</div>

              {/* Score circle */}
              <div className="flex items-center gap-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center border-4 flex-shrink-0"
                  style={{
                    borderColor: '#F59E0B',
                    background: 'rgba(245,158,11,0.1)',
                    boxShadow: '0 0 30px rgba(245,158,11,0.3)',
                  }}
                >
                  <div className="text-center">
                    <div className="text-amber font-bold text-2xl font-poppins">94%</div>
                    <div className="text-text-muted text-[9px]">match</div>
                  </div>
                </div>
                <div className="text-text-secondary text-xs leading-relaxed">
                  You and Priya share <span className="text-white">12 interests</span> and have <span className="text-white">very similar activity times</span> on campus.
                </div>
              </div>

              {/* Interest bars */}
              {[
                { label: 'Coding & Tech', score: 95, color: '#6C3DFF' },
                { label: 'Startups', score: 88, color: '#FF6B9D' },
                { label: 'Music', score: 72, color: '#10B981' },
                { label: 'Reading', score: 60, color: '#F59E0B' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">{item.label}</span>
                    <span style={{ color: item.color }} className="font-semibold">{item.score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.score}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}

              {/* Shared tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {['React', 'ICPC', 'Guitar', 'YC Startups', 'Chess'].map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(108,61,255,0.2)', color: '#8B5CF6' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </MockupBox>
        </SectionWrapper>

        {/* Section 4: Communities */}
        <SectionWrapper reverse>
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(255,107,157,0.15)', color: '#FF6B9D' }}
            >
              🏘️ COMMUNITIES
            </div>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-5">
              Your Campus, Your Crew
            </h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Beyond one-on-one connections, Origo brings together students who share passions. Join communities, post updates, attend events, and build your campus identity.
            </p>
            <div className="space-y-4">
              {[
                { icon: '🏫', title: 'College Communities', desc: 'Your college has its own private space — announcements, events, and campus culture.' },
                { icon: '❤️', title: 'Interest Groups', desc: 'Tech, music, sports, art, literature — find your people beyond your department.' },
                { icon: '📅', title: 'Campus Events', desc: 'Discover and RSVP to events happening at your college and nearby campuses.' },
                { icon: '📝', title: 'Community Posts', desc: 'Share thoughts, ask questions, and engage with your campus community.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(255,107,157,0.12)' }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm font-poppins">{item.title}</div>
                    <div className="text-text-secondary text-sm mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <MockupBox accent="#FF6B9D">
            <div className="space-y-3">
              <div className="text-text-muted text-xs font-semibold uppercase mb-4">Communities for You</div>
              {[
                { name: 'IIT Delhi CS Club', members: '1.2K members', icon: '💻', color: '#6C3DFF' },
                { name: 'Startup Founders', members: '843 members', icon: '🚀', color: '#F59E0B' },
                { name: 'Campus Musicians', members: '2.1K members', icon: '🎸', color: '#FF6B9D' },
                { name: 'Competitive Coders', members: '567 members', icon: '⚡', color: '#10B981' },
              ].map((community) => (
                <div
                  key={community.name}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderColor: '#2A2A45', background: '#16213E' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: `${community.color}20` }}
                  >
                    {community.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm font-semibold">{community.name}</div>
                    <div className="text-text-muted text-xs">{community.members}</div>
                  </div>
                  <button
                    className="text-xs px-3 py-1 rounded-full font-semibold"
                    style={{ background: `${community.color}20`, color: community.color }}
                  >
                    Join
                  </button>
                </div>
              ))}

              <div
                className="p-3 rounded-xl border"
                style={{ borderColor: 'rgba(255,107,157,0.3)', background: 'rgba(255,107,157,0.05)' }}
              >
                <div className="text-xs text-text-muted mb-1.5">📅 Upcoming Event</div>
                <div className="text-white text-sm font-semibold">HackIITD 2025</div>
                <div className="text-text-muted text-xs mt-0.5">Sat, Jan 18 · IIT Delhi Campus</div>
                <div className="mt-2 flex gap-2">
                  <div
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(16,185,129,0.2)', color: '#10B981' }}
                  >
                    247 attending
                  </div>
                </div>
              </div>
            </div>
          </MockupBox>
        </SectionWrapper>

        {/* Section 5: Ship a Friend */}
        <SectionWrapper>
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#8B5CF6' }}
            >
              👫 SHIP A FRIEND
            </div>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-5">
              Play Matchmaker
            </h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              You know your friends better than any algorithm. Ship a Friend lets you nominate two people you think would be perfect together — and send them both a nudge.
            </p>
            <div className="space-y-4">
              {[
                { icon: '🎯', title: 'Pick Two Friends', desc: 'Browse your connections and select two people you think have chemistry.' },
                { icon: '📨', title: 'Send the Ship', desc: 'Both get a notification: "Someone thinks you two would be great together!"' },
                { icon: '🔐', title: 'Anonymous or Named', desc: 'Choose to reveal yourself or stay anonymous as the matchmaker.' },
                { icon: '🎉', title: 'Earn Ship Points', desc: 'Successful ships earn you Ship Points, redeemable for premium features.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.12)' }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm font-poppins">{item.title}</div>
                    <div className="text-text-secondary text-sm mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <MockupBox accent="#8B5CF6">
            <div className="space-y-4">
              <div className="text-text-muted text-xs font-semibold uppercase">Ship Request</div>

              <div
                className="p-4 rounded-2xl border text-center"
                style={{ borderColor: 'rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.08)' }}
              >
                <div className="text-3xl mb-2">💌</div>
                <div className="text-white font-semibold font-poppins text-sm mb-1">Someone shipped you!</div>
                <div className="text-text-muted text-xs">A friend thinks you and someone are perfect together</div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold font-poppins mx-auto mb-2">R</div>
                  <div className="text-white text-xs font-semibold">Rahul</div>
                  <div className="text-text-muted text-[10px]">BITS Pilani</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-2xl">💞</div>
                  <div className="text-text-muted text-xs">89% match</div>
                </div>
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold font-poppins mx-auto mb-2"
                    style={{ background: '#FF6B9D' }}
                  >
                    A
                  </div>
                  <div className="text-white text-xs font-semibold">Ananya</div>
                  <div className="text-text-muted text-[10px]">VIT Vellore</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: '#2A2A45', color: '#B0B0CC' }}
                >
                  Decline
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #6C3DFF, #FF6B9D)' }}
                >
                  Start Rizz In 5 ⚡
                </button>
              </div>

              <div
                className="p-3 rounded-xl flex items-center gap-2"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <span>🏆</span>
                <div>
                  <div className="text-amber text-xs font-semibold">Ship Points: 120</div>
                  <div className="text-text-muted text-[10px]">Earn 50pts for every successful ship</div>
                </div>
              </div>
            </div>
          </MockupBox>
        </SectionWrapper>

        {/* Section 6: Privacy & Safety */}
        <SectionWrapper reverse>
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
            >
              🔒 PRIVACY & SAFETY
            </div>
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-5">
              Your Safety is Our Priority
            </h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              We built Origo with privacy-first principles. You are always in control of your data, your visibility, and your interactions.
            </p>
            <div className="space-y-4">
              {[
                { icon: '🚫', title: 'Block & Report', desc: 'Block any user instantly. Reports are reviewed by our safety team within 24 hours.' },
                { icon: '🔏', title: 'Privacy Controls', desc: 'Choose who sees your profile, your interests, your college, and your online status.' },
                { icon: '🗄️', title: 'Data Ownership', desc: 'Download all your data anytime. Delete your account and all data permanently.' },
                { icon: '🛡️', title: 'End-to-End Encryption', desc: 'All messages are encrypted. We cannot read your private conversations.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.12)' }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm font-poppins">{item.title}</div>
                    <div className="text-text-secondary text-sm mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <MockupBox accent="#10B981">
            <div className="space-y-4">
              <div className="text-text-muted text-xs font-semibold uppercase">Privacy Settings</div>

              {[
                { label: 'Show my college', enabled: true },
                { label: 'Show my year', enabled: true },
                { label: 'Show online status', enabled: false },
                { label: 'Allow cross-campus discovery', enabled: false },
                { label: 'Show in "Who viewed me"', enabled: true },
              ].map((setting) => (
                <div
                  key={setting.label}
                  className="flex items-center justify-between py-2.5 border-b"
                  style={{ borderColor: '#2A2A45' }}
                >
                  <span className="text-text-secondary text-sm">{setting.label}</span>
                  <div
                    className="relative w-11 h-6 rounded-full cursor-pointer transition-colors"
                    style={{ background: setting.enabled ? '#10B981' : '#2A2A45' }}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: setting.enabled ? 'translateX(22px)' : 'translateX(4px)' }}
                    />
                  </div>
                </div>
              ))}

              <div
                className="mt-4 p-4 rounded-xl border"
                style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}
              >
                <div className="flex items-center gap-2 text-green text-sm font-semibold mb-1">
                  <span>🛡️</span> Security Status
                </div>
                <div className="text-text-secondary text-xs">All messages encrypted · Data stored in India · GDPR compliant</div>
              </div>
            </div>
          </MockupBox>
        </SectionWrapper>
      </div>

      {/* Bottom CTA */}
      <section className="py-20 text-center" style={{ background: 'linear-gradient(180deg, #0D0D14 0%, #1A1A2E 100%)' }}>
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-4">
            Ready to find your campus tribe?
          </h2>
          <p className="text-text-secondary mb-8">
            Download Origo today and start making real connections.
          </p>
          <Link
            to="/download"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold font-poppins px-10 py-4 rounded-full text-base transition-all duration-200"
            style={{ boxShadow: '0 0 40px rgba(108,61,255,0.4)' }}
          >
            <span>📱</span>
            Download Free
          </Link>
        </div>
      </section>
    </main>
  );
}
