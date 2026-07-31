/**
 * BITS student-ID parsing.
 * -------------------------
 * BITS email local-parts encode admission year and degree type, e.g.
 * `f20230141@hyderabad.bits-pilani.ac.in`:
 *
 *   f        2023           0141
 *   │        └ joining year └ ID number (unused)
 *   └ degree type: f = first degree, h = higher degree, p = PhD
 *
 * This is a verified credential, so joiningYear/degreeType are derived here
 * and never self-reported — a user cannot claim to be in a batch they aren't
 * in. Parse failure (transfers, legacy formats, non-BITS domains) leaves both
 * fields null; it must never block verification itself.
 */

export interface ParsedCollegeId {
  degreeType: 'f' | 'h' | 'p';
  joiningYear: number;
}

const BITS_ID_PATTERN = /^([fhp])(\d{4})\d{4}$/i;

export function parseBitsId(email: string): ParsedCollegeId | null {
  const localPart = email.split('@')[0];
  if (!localPart) return null;
  const match = BITS_ID_PATTERN.exec(localPart);
  if (!match) return null;

  const degreeType = match[1]!.toLowerCase() as 'f' | 'h' | 'p';
  const joiningYear = Number.parseInt(match[2]!, 10);

  // Sanity bound: a parse that "succeeds" against garbage input (e.g. a local
  // part that happens to match the shape) shouldn't produce a nonsense year.
  const currentYear = new Date().getFullYear();
  if (joiningYear < 2015 || joiningYear > currentYear + 1) return null;

  return { degreeType, joiningYear };
}
