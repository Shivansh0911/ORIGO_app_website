import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { happeningFeed, type HappeningItem } from '../../lib/freshers/content';
import { track } from '../../lib/telemetry';

/**
 * "Happening Around You" — a horizontally-scrolling banner carousel of campus
 * events, milestones, and (sparingly) sponsored cards. Sponsored inventory is
 * interleaved at ~1 per 5 items and clearly labelled, per the ad-load discipline
 * in The Freshers Playbook (§5): utility first, revenue second.
 */
function Card({ item }: { item: HappeningItem }) {
  const navigate = useNavigate();
  const sponsored = item.kind === 'sponsored';
  return (
    <button
      onClick={() => { track('happening_click', { id: item.id, kind: item.kind }); if (item.to) navigate(item.to); }}
      className="relative shrink-0 w-[280px] text-left rounded-2xl border border-border bg-card overflow-hidden p-5 hover:border-primary/40 transition-colors snap-start"
      style={{ boxShadow: `0 0 0 rgba(0,0,0,0)` }}
    >
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${item.accent}, transparent)` }}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${item.accent}22` }}
        >
          {item.emoji}
        </div>
        {sponsored ? (
          <span className="text-[10px] uppercase tracking-wide text-text-muted border border-border rounded-full px-2 py-0.5">
            Sponsored
          </span>
        ) : item.kind === 'milestone' ? (
          <span className="text-[10px] uppercase tracking-wide text-green border border-green/30 rounded-full px-2 py-0.5">
            Milestone
          </span>
        ) : null}
      </div>
      <h3 className="text-text-primary font-semibold leading-snug mb-1">{item.title}</h3>
      <p className="text-text-muted text-sm">{item.subtitle}</p>
      {sponsored && item.sponsorName && (
        <p className="text-text-muted text-xs mt-2">by {item.sponsorName}</p>
      )}
      {item.cta && (
        <span className="inline-block mt-3 text-sm font-medium" style={{ color: item.accent }}>
          {item.cta} →
        </span>
      )}
    </button>
  );
}

export default function HappeningCarousel({ title = 'Happening around you' }: { title?: string }) {
  const feed = happeningFeed();
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
        <div className="flex gap-1">
          <button onClick={() => scrollBy(-1)} className="w-8 h-8 rounded-full border border-border text-text-secondary hover:text-primary hover:border-primary/50 flex items-center justify-center transition-colors" aria-label="Scroll left">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => scrollBy(1)} className="w-8 h-8 rounded-full border border-border text-text-secondary hover:text-primary hover:border-primary/50 flex items-center justify-center transition-colors" aria-label="Scroll right">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div ref={scroller} className="flex gap-3 overflow-x-auto pb-2 snap-x scroll-smooth" style={{ scrollbarWidth: 'none' }}>
        {feed.map((item) => <Card key={item.id} item={item} />)}
      </div>
    </section>
  );
}
