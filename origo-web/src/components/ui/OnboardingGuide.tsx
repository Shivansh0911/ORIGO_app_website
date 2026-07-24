import { useState } from 'react';

const SLIDES = [
  {
    emoji: '👋',
    title: 'Welcome to Origo',
    desc: 'The campus social app built for Indian students. Make real connections — not just followers.',
    color: 'from-primary/10 to-accent/10',
    dot: 'bg-primary',
  },
  {
    emoji: '🧭',
    title: 'Discover People',
    desc: 'Browse students from your campus who share your interests, course, or vibe. Swipe, connect, match.',
    color: 'from-blue-50 to-indigo-50',
    dot: 'bg-blue-500',
  },
  {
    emoji: '⚡',
    title: 'Rizz in 5',
    desc: 'Nervous about the first message? Get 5 AI-crafted icebreakers tailored to who you\'re talking to.',
    color: 'from-yellow-50 to-orange-50',
    dot: 'bg-yellow-500',
  },
  {
    emoji: '💕',
    title: 'Ship a Friend',
    desc: 'Think two people would be perfect together? Anonymously suggest the match — let love take care of the rest.',
    color: 'from-pink-50 to-rose-50',
    dot: 'bg-pink-500',
  },
  {
    emoji: '👥',
    title: 'Communities',
    desc: 'Join groups built around what you love — from coding clubs to chai addas. Post, comment, belong.',
    color: 'from-green-50 to-emerald-50',
    dot: 'bg-green-500',
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingGuide({ onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx]!;
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden">
        {/* Skip */}
        <button
          onClick={onDone}
          className="absolute top-4 right-4 text-xs text-text-muted hover:text-text-secondary transition-colors px-2 py-1 rounded-lg hover:bg-muted"
        >
          Skip
        </button>

        {/* Progress dots */}
        <div className="absolute top-5 left-0 right-0 flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? `w-6 ${slide.dot}` : 'w-1.5 bg-border'}`}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className={`bg-gradient-to-br ${slide.color} px-8 pt-16 pb-10 flex flex-col items-center text-center min-h-[360px]`}>
          <div className="text-7xl mb-6 select-none">{slide.emoji}</div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">{slide.title}</h2>
          <p className="text-text-secondary text-sm leading-relaxed">{slide.desc}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex gap-3">
          {idx > 0 && (
            <button
              onClick={() => setIdx(idx - 1)}
              className="flex-1 py-3 border border-border text-text-secondary rounded-2xl text-sm font-medium hover:bg-muted transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => isLast ? onDone() : setIdx(idx + 1)}
            className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary-light transition-colors"
          >
            {isLast ? "Let's go!" : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
