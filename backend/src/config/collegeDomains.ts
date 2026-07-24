// SEC-04: Verified campus email domain allowlist.
// Add each campus as the pilot expands. Contact dev@origo.app to register a new campus.
// Domain match is case-insensitive and must be an exact suffix (not substring).

export interface CollegeDomain {
  domain: string;
  collegeName: string;
}

export const COLLEGE_DOMAINS: CollegeDomain[] = [
  // ── Pilot campus ────────────────────────────────────────────────────────────
  { domain: 'hyderabad.bits-pilani.ac.in', collegeName: 'BITS Pilani — Hyderabad Campus' },
  // ── Expand here ─────────────────────────────────────────────────────────────
  // { domain: 'pilani.bits-pilani.ac.in',   collegeName: 'BITS Pilani — Pilani Campus' },
  // { domain: 'goa.bits-pilani.ac.in',      collegeName: 'BITS Pilani — Goa Campus' },
  // { domain: 'iith.ac.in',                 collegeName: 'IIT Hyderabad' },
  // { domain: 'iitb.ac.in',                 collegeName: 'IIT Bombay' },
];

export function findCollegeByEmail(email: string): CollegeDomain | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  return COLLEGE_DOMAINS.find((c) => c.domain === domain) ?? null;
}
