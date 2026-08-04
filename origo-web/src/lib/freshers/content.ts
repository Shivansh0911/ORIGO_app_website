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
  { id: 'communities', title: 'Join 3 communities', description: 'Find your people around shared interests and clubs.', emoji: '🏘️', points: 15, to: '/app/communities' },
  { id: 'senior', title: 'Ask a senior', description: 'Get the inside scoop from someone who’s been there.', emoji: '🧭', points: 10, to: '/app/seniors' },
  { id: 'connect', title: 'Make your first connection', description: 'Start a Rizz In 5 or match with someone new.', emoji: '⚡', points: 15, to: '/app/discover' },
];

// Happening Around You is no longer seed data — it's a real GET /v1/happening
// endpoint backed by the HappeningEvent table (see BUILD_PLAN.md 1.9 and
// backend/src/routes/happening.routes.ts). The seed constants and sponsored-
// card interleaving logic that used to live here have been removed along with
// the sponsored-card feature itself, which is out of scope for launch.

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

// Batch Space is cut (decisions/0003 + BUILD_PLAN.md 1.1) — it competed
// directly with the batch WhatsApp group every fresher is already in. What
// WhatsApp can't do (structured discovery) folds into Discover instead.

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
      'Pineapple belongs on pizza. Fight me.',
      'Mess food is underrated and you all know it',
      '8am classes are a human rights violation',
    ],
  },
  {
    label: "You'll find me",
    suggestions: [
      'At the canteen. Always.',
      'In the library at 2am, panicking',
      'Wherever there is free food',
    ],
  },
  {
    label: 'Ask me about',
    suggestions: [
      'My hometown — I will not shut up',
      'The most useless skill I have',
      'Why I actually picked this branch',
    ],
  },
  {
    label: 'Looking for someone to',
    suggestions: [
      'Explore the city with on weekends',
      'Panic about deadlines with at 3am',
      'Split a Swiggy order with',
    ],
  },
  {
    label: 'Two truths and a lie',
    suggestions: [
      'Never left my state before this. Can drive. Scared of pigeons.',
      'I can cook, I can swim, I can wake up before 9',
    ],
  },
  {
    label: 'My most controversial opinion',
    suggestions: [
      'Filter coffee > everything',
      'Group projects should be illegal',
      'The north campus canteen is better and I can prove it',
    ],
  },
  {
    label: 'This year I want to',
    suggestions: [
      'Join a club I know nothing about',
      'Actually use the gym I signed up for',
      'Find my people before semester ends',
    ],
  },
  {
    label: 'Green flag I look for',
    suggestions: [
      'Replies to texts like a functioning adult',
      'Will try the weird item on the menu',
      'Has strong opinions about something harmless',
    ],
  },
];
