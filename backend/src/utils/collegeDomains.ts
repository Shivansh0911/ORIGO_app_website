/**
 * Google Workspace domain → college resolver.
 * --------------------------------------------
 * Not every college issues Google Workspace (G Suite) accounts, but many do —
 * and when a student signs in with one, Google's ID token carries an `hd`
 * ("hosted domain") claim identifying the organization's domain. That's a much
 * stronger identity signal than a personal Gmail address: it's issued and
 * controlled by the institution itself.
 *
 * Policy: resolves against the exact same campus allowlist used for manual
 * college-email OTP verification (see ../config/collegeDomains — SEC-04).
 * Google sign-in is a *convenience* for campuses already approved for the
 * pilot, never a separate way to widen who counts as verified — a domain
 * that isn't on that list (including any other .edu/.ac institution) falls
 * back to the normal manual college-email verification flow.
 */

import { COLLEGE_DOMAINS } from '../config/collegeDomains';

export interface ResolvedCampus {
  collegeName: string;
}

/**
 * Resolve a Google Workspace hosted-domain claim to a college. Returns `null`
 * when there's no `hd` (personal account) or the domain isn't on the campus
 * allowlist yet — callers should fall back to manual verification in that case.
 */
export function resolveCollegeFromWorkspaceDomain(hd: string | undefined | null): ResolvedCampus | null {
  if (!hd) return null;
  const domain = hd.toLowerCase();
  const match = COLLEGE_DOMAINS.find((c) => c.domain === domain);
  return match ? { collegeName: match.collegeName } : null;
}
