/**
 * Origo client-side matching engine
 * ---------------------------------
 * This is a Phase-0 / Phase-1 re-ranking layer that runs in the browser on the
 * candidate list returned by `/discover`. It replaces the single symmetric
 * Jaccard formula (see backend/src/services/discover.service.ts) with:
 *
 *   1. Intent-aware weighting     — dating, friends, networking and study
 *                                    buddy are scored with different weights,
 *                                    because they are different problems.
 *   2. Weighted interest overlap  — shared *specific* interests count full,
 *                                    same-category-different-interest counts
 *                                    partial (a cheap stand-in for IDF/rarity
 *                                    weighting until we have global frequencies).
 *   3. Graph overlap (Adamic–Adar)— mutual communities, weighted *down* when the
 *                                    shared community is huge. This is the
 *                                    "People You May Know" signal and it is the
 *                                    dominant term for friendship.
 *   4. Reciprocity proxy          — a directional, asymmetric estimate of "are
 *                                    they open to me" so we stop assuming
 *                                    interest is symmetric. True reciprocity
 *                                    needs per-user response history (Phase 1,
 *                                    backend) — this is the best client-side
 *                                    approximation until that data exists.
 *   5. Recency + completeness     — soft freshness / profile-quality boosts.
 *
 * On top of scoring, `rankCandidates` applies a light MMR-style diversity
 * re-rank + optional exploration jitter, so the feed does not collapse onto a
 * handful of near-identical "safe" profiles (the failure mode that killed
 * Tinder's pure-Elo system).
 *
 * Everything here is a pure function and is intended to be portable: the same
 * logic should move server-side once outcome logging exists (see
 * IMPLEMENTATION.md → "Deferred to backend").
 */

import type { PublicUser, UserInterest } from '../types';

export type Intent = 'DATING' | 'FRIENDS' | 'NETWORKING' | 'STUDY_BUDDY';

/** A community the scorer knows about, with enough info for Adamic–Adar. */
export interface CommunityRef {
  id: string;
  memberCount: number;
  category?: string;
}

/** Everything the scorer needs about the *viewer* (works for User or PublicUser). */
export interface Viewer {
  id: string;
  collegeName: string | null;
  lookingFor: string[];
  interests: UserInterest[];
  communities?: CommunityRef[];
}

/** Optional signals that sharpen scoring when the client has them. */
export interface MatchContext {
  /** Communities the candidate belongs to (for graph overlap). */
  candidateCommunities?: CommunityRef[];
  /**
   * Historical response signal for this candidate, if the client has it, e.g.
   * derived from past Rizz outcomes. 0..1, where 1 == very responsive.
   * When absent we fall back to the structural reciprocity proxy.
   */
  candidateResponsiveness?: number;
}

export interface ScoreComponent {
  key: 'interest' | 'graph' | 'reciprocity' | 'goals' | 'campus' | 'recency' | 'completeness';
  label: string;
  /** Raw component value, 0..1. */
  value: number;
  /** Weight applied for the active intent, 0..1. */
  weight: number;
  /** value * weight * 100 — contribution to the final score. */
  points: number;
}

export interface ScoredUser extends PublicUser {
  compatibilityScore: number;
  components: ScoreComponent[];
  /** Human-readable "why you're seeing this" strings, best first. */
  reasons: string[];
}

// ── Intent weight profiles ───────────────────────────────────────────────────
// Each profile sums to ~1.0. Weights are deliberately different per intent:
// friendship is graph-dominated, dating is reciprocity-dominated, networking /
// study lean on goals + campus/program overlap. These are hand-set priors — the
// point of Phase 1 is to *learn* them from Rizz outcomes, not to defend 0.30.
const WEIGHTS: Record<Intent, Record<ScoreComponent['key'], number>> = {
  DATING: {
    interest: 0.28, reciprocity: 0.30, campus: 0.14, graph: 0.10,
    goals: 0.08, recency: 0.06, completeness: 0.04,
  },
  FRIENDS: {
    interest: 0.30, graph: 0.34, reciprocity: 0.10, campus: 0.10,
    goals: 0.06, recency: 0.06, completeness: 0.04,
  },
  NETWORKING: {
    interest: 0.24, graph: 0.28, goals: 0.18, campus: 0.16,
    reciprocity: 0.06, recency: 0.04, completeness: 0.04,
  },
  STUDY_BUDDY: {
    interest: 0.22, graph: 0.26, campus: 0.22, goals: 0.18,
    reciprocity: 0.04, recency: 0.04, completeness: 0.04,
  },
};

const COMPONENT_LABELS: Record<ScoreComponent['key'], string> = {
  interest: 'Shared interests',
  graph: 'Mutual communities',
  reciprocity: 'Likely to click',
  goals: 'Same goals',
  campus: 'Campus',
  recency: 'Recently active',
  completeness: 'Complete profile',
};

// ── Primitive similarity functions ───────────────────────────────────────────

/** Jaccard on two sets: |A ∩ B| / |A ∪ B|. */
export function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Interest similarity that rewards *specific* shared interests over merely
 * belonging to the same broad category. Full credit for an exact interest
 * match; partial credit for category overlap. This is a cheap stand-in for
 * proper rarity/IDF weighting (which needs global interest frequencies — a
 * backend concern) but already beats flat Jaccard for surfacing niche overlap.
 */
export function interestSimilarity(a?: UserInterest[] | null, b?: UserInterest[] | null): number {
  if (!a || !b || !Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) return 0;

  const aIds = new Set(a.map((i) => i?.interestId).filter(Boolean));
  const bIds = new Set(b.map((i) => i?.interestId).filter(Boolean));
  const aCats = new Set(a.map((i) => i?.interest?.category).filter(Boolean));
  const bCats = new Set(b.map((i) => i?.interest?.category).filter(Boolean));

  const exact = jaccard(aIds, bIds);
  const category = jaccard(aCats, bCats);

  return Math.min(1, exact * 0.8 + category * 0.2);
}

export function adamicAdar(a?: CommunityRef[] | null, b?: CommunityRef[] | null): number {
  if (!a || !b || !Array.isArray(a) || !Array.isArray(b) || !a.length || !b.length) return 0;
  const byId = new Map(b.map((c) => [c.id, c]));
  let raw = 0;
  for (const c of a) {
    const shared = byId.get(c.id);
    if (!shared) continue;
    const n = Math.max(shared.memberCount, c.memberCount, 2);
    raw += 1 / Math.log(n);
  }
  if (raw === 0) return 0;
  return 1 - Math.exp(-raw * 1.2);
}

export function recencyScore(lastSeen: string | null): number {
  if (!lastSeen) return 0;
  const hours = (Date.now() - new Date(lastSeen).getTime()) / 3_600_000;
  if (hours < 1) return 1;
  if (hours < 24) return 0.7;
  if (hours < 72) return 0.4;
  if (hours < 24 * 7) return 0.15;
  return 0;
}

export function completenessScore(u: { bio?: string | null; avatarUrl?: string | null; interests?: UserInterest[] | null }): number {
  return (u?.avatarUrl ? 0.5 : 0) + (u?.bio ? 0.3 : 0) + (((u?.interests?.length ?? 0) >= 3) ? 0.2 : 0);
}

export function reciprocityScore(
  me: Viewer,
  candidate: PublicUser,
  intent: Intent,
  ctx?: MatchContext,
): number {
  const theyWantThis = candidate?.lookingFor?.includes(intent) ? 1 : 0.35;
  const mutualInterest = interestSimilarity(me?.interests, candidate?.interests);
  const structural = theyWantThis * (0.4 + 0.6 * mutualInterest);
  if (ctx?.candidateResponsiveness != null) {
    return 0.5 * structural + 0.5 * ctx.candidateResponsiveness;
  }
  return structural;
}

export function goalScore(me: Viewer, candidate: PublicUser): number {
  return jaccard(new Set(me?.lookingFor ?? []), new Set(candidate?.lookingFor ?? []));
}

// ── Composite scoring ────────────────────────────────────────────────────────

/**
 * Score a single candidate for a given intent. Returns the 0..100 score, the
 * per-component breakdown (for a "why this match" UI) and best-first human
 * reasons. When a component's input data is missing (e.g. no community context)
 * its weight is redistributed across the remaining components so scores stay
 * comparable instead of being silently penalised.
 */
export function scoreCandidate(
  me: Viewer,
  candidate: PublicUser,
  intent: Intent,
  ctx?: MatchContext,
): ScoredUser {
  const weights = WEIGHTS[intent];
  const myCommunities = me.communities ?? [];
  const theirCommunities = ctx?.candidateCommunities ?? [];
  const hasGraph = myCommunities.length > 0 && theirCommunities.length > 0;

  const raw: Record<ScoreComponent['key'], number> = {
    interest: interestSimilarity(me.interests, candidate.interests),
    graph: hasGraph ? adamicAdar(myCommunities, theirCommunities) : 0,
    reciprocity: reciprocityScore(me, candidate, intent, ctx),
    goals: goalScore(me, candidate),
    campus: candidate.collegeName && candidate.collegeName === me.collegeName ? 1 : 0,
    recency: recencyScore(candidate.lastSeen),
    completeness: completenessScore(candidate),
  };

  // Redistribute the weight of any component whose data is unavailable.
  const activeKeys = (Object.keys(weights) as ScoreComponent['key'][]).filter(
    (k) => !(k === 'graph' && !hasGraph),
  );
  const activeWeightSum = activeKeys.reduce((s, k) => s + weights[k], 0) || 1;

  const components: ScoreComponent[] = activeKeys.map((key) => {
    const weight = weights[key] / activeWeightSum;
    const value = raw[key];
    return { key, label: COMPONENT_LABELS[key], value, weight, points: value * weight * 100 };
  });

  const score = Math.round(
    Math.min(100, components.reduce((s, c) => s + c.points, 0)),
  );

  return {
    ...candidate,
    compatibilityScore: score,
    components,
    reasons: buildReasons(me, candidate, raw, ctx),
  };
}

/** Best-first, human-readable explanations for the card. */
function buildReasons(
  me: Viewer,
  candidate: PublicUser,
  raw: Record<ScoreComponent['key'], number>,
  ctx?: MatchContext,
): string[] {
  const reasons: string[] = [];

  const sharedInterests = candidate.interests.filter((ci) =>
    me.interests.some((mi) => mi.interestId === ci.interestId),
  );
  if (sharedInterests.length > 0) {
    const names = sharedInterests.slice(0, 3).map((i) => i.interest?.name).filter(Boolean);
    reasons.push(
      sharedInterests.length === 1
        ? `You both like ${names[0]}`
        : `${sharedInterests.length} shared interests including ${names.join(', ')}`,
    );
  }

  const myComm = me.communities ?? [];
  const theirComm = ctx?.candidateCommunities ?? [];
  const sharedComm = myComm.filter((c) => theirComm.some((t) => t.id === c.id));
  if (sharedComm.length > 0) {
    reasons.push(
      sharedComm.length === 1
        ? `You're both in the same community`
        : `${sharedComm.length} communities in common`,
    );
  }

  if (raw.campus === 1 && candidate.collegeName) {
    reasons.push(`Same campus · ${candidate.collegeName}`);
  }
  if (raw.recency >= 0.7) reasons.push('Active recently');

  return reasons;
}

// ── Ranking with diversity + exploration ─────────────────────────────────────

export interface RankOptions {
  intent: Intent;
  /** Optional per-candidate context, keyed by candidate id. */
  contextById?: Record<string, MatchContext>;
  /**
   * Exploration factor 0..1. Adds bounded random jitter so newer / less-active
   * profiles still surface instead of the ranking calcifying. Default 0.06.
   * This is the light client-side version of the Phase-2 bandit idea.
   */
  exploration?: number;
  /**
   * Diversity strength 0..1 for the MMR-style re-rank that avoids showing a run
   * of near-identical profiles. Default 0.25. 0 disables it.
   */
  diversity?: number;
}

/**
 * Score, then re-rank a candidate list. Applies:
 *   1. intent-aware scoring,
 *   2. optional exploration jitter,
 *   3. a greedy MMR diversity pass that penalises a candidate for being too
 *      similar (shared interests) to those already placed above it.
 */
export function rankCandidates(
  me: Viewer,
  candidates: PublicUser[],
  opts: RankOptions,
): ScoredUser[] {
  const exploration = opts.exploration ?? 0.06;
  const diversity = opts.diversity ?? 0.25;

  const scored = candidates.map((c) => {
    const s = scoreCandidate(me, c, opts.intent, opts.contextById?.[c.id]);
    if (exploration > 0) {
      const jitter = (Math.random() - 0.5) * 2 * exploration * 100;
      s.compatibilityScore = Math.max(0, Math.min(100, Math.round(s.compatibilityScore + jitter)));
    }
    return s;
  });

  if (diversity <= 0) {
    return scored.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }

  // Greedy MMR: repeatedly pick the best remaining candidate after subtracting a
  // similarity penalty against the most-similar already-selected candidate.
  const remaining = [...scored].sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  const selected: ScoredUser[] = [];
  while (remaining.length) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      let maxSim = 0;
      for (const sel of selected) {
        const sim = interestSimilarity(cand.interests, sel.interests);
        if (sim > maxSim) maxSim = sim;
      }
      const mmr = cand.compatibilityScore * (1 - diversity) - maxSim * 100 * diversity;
      if (mmr > bestVal) { bestVal = mmr; bestIdx = i; }
    }
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }
  return selected;
}

/**
 * Derive a default intent from the viewer's lookingFor list.
 *
 * FRIENDS deliberately outranks DATING. Origo is a campus socialising
 * platform where romance is one outcome among several — not a dating app.
 * A user who selects both should land in the social feed by default and
 * choose dating explicitly, because whichever surface opens by default is
 * the category the product gets filed under in a user's head. Ordering
 * DATING first here quietly made Origo a dating app for every user who
 * ticked both boxes.
 */
export function primaryIntent(lookingFor: string[]): Intent {
  const order: Intent[] = ['FRIENDS', 'NETWORKING', 'STUDY_BUDDY', 'DATING'];
  for (const intent of order) if (lookingFor.includes(intent)) return intent;
  return 'FRIENDS';
}

/**
 * Map a 0..100 score to a qualitative band. We surface bands, not raw numbers:
 * a precise "94%" invites gaming and implies false precision the model doesn't
 * have — Hinge/Tinder/Bumble all avoid exposing internal scores this literally.
 * The exact component breakdown stays available in the "Why this match" UI.
 */
export function compatibilityBand(score: number): { label: string; tone: 'great' | 'strong' | 'ok' | 'new' } {
  if (score >= 75) return { label: 'Great match', tone: 'great' };
  if (score >= 55) return { label: 'Strong match', tone: 'strong' };
  if (score >= 35) return { label: 'Worth a hello', tone: 'ok' };
  return { label: 'New face', tone: 'new' };
}
