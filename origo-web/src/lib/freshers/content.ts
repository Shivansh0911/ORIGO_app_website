/**
 * Freshers-season seed content.
 * -----------------------------
 * This is client-side seed data that stands in for endpoints that don't exist
 * yet. Each export maps to a future backend resource (noted per block). Swapping
 * to the real API later means replacing these constants with a fetch — the
 * component code consuming them shouldn't need to change shape.
 *
 * See IMPLEMENTATION.md → "Deferred to backend" for the endpoint contracts.
 */

export interface Quest {
  id: string;
  title: string;
  description: string;
  emoji: string;
  points: number;
  /** Route this quest nudges the user toward, if any. */
  to?: string;
}

/** GET /v1/freshers/quests (+ user completion state) — seed for now. */
export const QUESTS: Quest[] = [
  { id: 'profile', title: 'Complete your profile', description: 'Add a photo, bio and 3+ interests so people can find you.', emoji: '🪪', points: 20, to: '/app/profile/edit' },
  { id: 'intro-card', title: 'Create your Intro Card', description: 'Generate a shareable card and post it before you arrive.', emoji: '🎴', points: 25, to: '/app/intro-card' },
  { id: 'batch', title: 'Join your Batch space', description: 'Meet your incoming batch before day one.', emoji: '🎓', points: 15, to: '/app/batch' },
  { id: 'communities', title: 'Join 3 communities', description: 'Find your people around shared interests and clubs.', emoji: '🏘️', points: 15, to: '/app/communities' },
  { id: 'senior', title: 'Ask a senior', description: 'Get the inside scoop from someone who’s been there.', emoji: '🧭', points: 10, to: '/app/seniors' },
  { id: 'connect', title: 'Make your first connection', description: 'Start a Rizz In 5 or match with someone new.', emoji: '⚡', points: 15, to: '/app/discover' },
];

export interface HappeningItem {
  id: string;
  kind: 'event' | 'sponsored' | 'milestone';
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;      // hex, drives the card glow
  cta?: string;
  to?: string;
  sponsorName?: string; // present when kind === 'sponsored'
}

/**
 * GET /v1/happening?campus=… — the "Happening Around You" carousel.
 * Sponsored cards are interleaved at ~1 per 5 items by `happeningFeed()` below,
 * per the ad-load discipline in The Freshers Playbook (§5).
 */
export const HAPPENING_EVENTS: HappeningItem[] = [
  { id: 'orientation', kind: 'event', title: 'Orientation Week kicks off', subtitle: 'Mon 9:00 AM · Main Auditorium', emoji: '🎉', accent: '#6C3DFF', cta: 'View schedule', to: '/app/happening' },
  { id: 'club-fair', kind: 'event', title: 'Club & Society Fair', subtitle: 'Wed 4:00 PM · Central Lawn', emoji: '🎪', accent: '#FF6B9D', cta: 'Browse clubs', to: '/app/communities' },
  { id: 'prom', kind: 'event', title: 'Freshers’ Night is coming', subtitle: '14 days away · find your crew', emoji: '💃', accent: '#F59E0B', cta: 'Open Prom Radar', to: '/app/prom' },
  { id: 'milestone', kind: 'milestone', title: 'Batch of ’30 just crossed 500', subtitle: 'Your incoming batch is filling up', emoji: '🚀', accent: '#10B981', cta: 'Join the batch', to: '/app/batch' },
  { id: 'hackathon', kind: 'event', title: 'HackNight registrations open', subtitle: 'Sat 6:00 PM · CS Block', emoji: '💻', accent: '#8B5CF6', cta: 'Count me in', to: '/app/communities' },
];

/** GET /v1/happening/sponsored?campus=… — local, flat-rate campus advertisers. */
export const HAPPENING_SPONSORED: HappeningItem[] = [
  { id: 'sp-chai', kind: 'sponsored', sponsorName: 'Campus Chai Co.', title: '20% off for freshers', subtitle: 'Show your Origo profile at the counter', emoji: '☕', accent: '#B4700A', cta: 'Get the deal' },
  { id: 'sp-cycle', kind: 'sponsored', sponsorName: 'GearUp Cycles', title: 'Freshers cycle rentals', subtitle: 'Free first week · near main gate', emoji: '🚲', accent: '#1F8A5F', cta: 'View offer' },
];

/**
 * Interleave sponsored cards into the event feed at ~1 per `every` items.
 * Keeps the carousel majority-utility, per the ad-load rule.
 */
export function happeningFeed(every = 5): HappeningItem[] {
  const out: HappeningItem[] = [];
  let sIdx = 0;
  HAPPENING_EVENTS.forEach((item, i) => {
    out.push(item);
    if ((i + 1) % every === 0 && sIdx < HAPPENING_SPONSORED.length) {
      out.push(HAPPENING_SPONSORED[sIdx++]);
    }
  });
  // Ensure at least one sponsored card is visible in a short seed feed.
  if (!out.some((x) => x.kind === 'sponsored') && HAPPENING_SPONSORED.length) {
    out.splice(Math.min(3, out.length), 0, HAPPENING_SPONSORED[0]);
  }
  return out;
}

export interface Senior {
  id: string;
  name: string;
  year: string;
  branch: string;
  avatarColor: string;
  topics: string[];
  blurb: string;
}

/** GET /v1/seniors?campus=… — verified seniors who opted into "ask me anything". */
export const SENIORS: Senior[] = [
  { id: 's1', name: 'Aditi R.', year: '3rd year', branch: 'CSE', avatarColor: '#6C3DFF', topics: ['Placements', 'Coding clubs', 'Hostel life'], blurb: 'DSA club lead. Ask me about internships and which electives are worth it.' },
  { id: 's2', name: 'Kabir M.', year: '4th year', branch: 'Mechanical', avatarColor: '#FF6B9D', topics: ['Fests', 'Sports', 'Mess & food'], blurb: 'Ran two campus fests. Happy to help you find your crowd.' },
  { id: 's3', name: 'Sneha P.', year: '2nd year', branch: 'ECE', avatarColor: '#10B981', topics: ['Academics', 'Societies', 'Settling in'], blurb: 'Was exactly where you are last year. Ask me anything, no question too small.' },
];

/** GET /v1/batch/:campus/:year — batch space header stats. */
export const BATCH_INFO = {
  name: "Batch of '30",
  members: 512,
  cities: 47,
  threads: [
    { id: 't1', emoji: '🏙️', title: 'Who else is from Delhi NCR?', replies: 38 },
    { id: 't2', emoji: '🛏️', title: 'Roommate vibes check — night owls?', replies: 61 },
    { id: 't3', emoji: '🎒', title: 'What do I actually need to pack?', replies: 44 },
    { id: 't4', emoji: '🎓', title: 'Ask a senior: which mess is best?', replies: 27 },
  ],
};

/** Prom Radar config. POST /v1/prom/opt-in, GET /v1/prom/status. */
export const PROM_INFO = {
  eventName: "Freshers' Night",
  daysAway: 14,
  optedInCount: 218,
};

/**
 * Icebreaker prompts offered in the Intro Card composer and profile.
 *
 * Each ships with 2-3 suggested answers so the field is never a blank page —
 * "write something witty on demand while a queue waits behind you" is where
 * most people freeze and type "hi". Suggestions are tappable starting points,
 * always editable afterwards. See BUILD_PLAN.md open question 3.
 */
export interface IcebreakerPrompt {
  label: string;
  suggestions: string[];
}

export const ICEBREAKER_PROMPTS: IcebreakerPrompt[] = [
  {
    label: 'Hot take',
    suggestions: [
      'Pineapple absolutely belongs on pizza.',
      'The mess food is actually underrated.',
      'Morning classes should not exist.',
    ],
  },
  {
    label: "You'll find me…",
    suggestions: [
      'At the canteen, always',
      'In the library at 2am before deadlines',
      'Wherever there\'s free food',
    ],
  },
  {
    label: 'Two truths, one lie',
    suggestions: [
      "I've never left my home state before this.",
      "I can't swim but I signed up for the swim club.",
      "I once talked to a celebrity and didn't realise it.",
    ],
  },
  {
    label: 'My campus goal this year',
    suggestions: [
      'Join a club I know nothing about',
      'Actually go to the gym I signed up for',
      'Find my people before the semester ends',
    ],
  },
  {
    label: 'Looking for someone to…',
    suggestions: [
      'Explore the city with on weekends',
      'Cram for exams with at 3am',
      'Split a Swiggy order with',
    ],
  },
  {
    label: 'Ask me about',
    suggestions: [
      'My hometown — I will not shut up about it',
      'The weirdest hobby I have',
      'Why I chose this branch',
    ],
  },
];
