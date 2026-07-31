import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { happeningApi, type HappeningEvent } from '../../api/endpoints';
import { track } from '../../lib/telemetry';

/**
 * "Happening Around You" — a horizontally-scrolling banner of real campus
 * events, fetched from GET /v1/happening (see BUILD_PLAN.md 1.9). Content is
 * team-curated, not seed data — this is the one surface whose content we
 * fully control, which makes it the day-one hero against emptiness.
 *
 * No sponsored cards. That plumbing existed in the seed-data version this
 * replaces; ad-load infrastructure is explicitly out of scope for launch.
 */
function Card({ item }: { item: HappeningEvent }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => { track('happening_click', { id: item.id }); if (item.linkTo) navigate(item.linkTo); }}
      className="relative shrink-0 w-[280px] text-left rounded-2xl border border-border bg-card overflow-hidden p-5 hover:border-primary/40 transition-colors snap-start"
    >
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${item.accent}, transparent)` }}
      />
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3"
        style={{ background: `${item.accent}22` }}
      >
        {item.emoji}
      </div>
      <h3 className="text-text-primary font-semibold leading-snug mb-1">{item.title}</h3>
      {item.subtitle && <p className="text-text-muted text-sm">{item.subtitle}</p>}
      {item.cta && (
        <span className="inline-block mt-3 text-sm font-medium" style={{ color: item.accent }}>
          {item.cta} →
        </span>
      )}
    </button>
  );
}

export default function HappeningCarousel({ title = 'Happening around you' }: { title?: string }) {
  const { data: feed = [] } = useQuery({
    queryKey: ['happening'],
    queryFn: () => happeningApi.getFeed().then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  // Honest empty state, not a dead carousel — per the density-tier principle
  // (BUILD_PLAN.md 1.1a): a visibly empty feed reads as an abandoned app.
  if (feed.length === 0) return null;

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
