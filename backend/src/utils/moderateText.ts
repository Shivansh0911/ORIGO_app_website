// SEC-10: basic text moderation applied to all user-generated free text.
// Replace this list with a proper bad-words library (e.g. `bad-words` npm package) or
// a Rekognition / OpenAI Moderation API call before launch.
// Deliberately short — the point is the hook exists and every write path calls it.

const BLOCKED_PATTERNS = [
  /\bn[i1]g{1,2}[ae3]r/i,
  /\bf[ua@]g{1,2}[o0]t/i,
  /\bch[uo]tiy[ae]/i,
  /\bbh[oa]nc?ho?d/i,
  /\bm[ao]d[ae]rf[au]ck/i,
  /\bc[uo]nt\b/i,
];

export class ModerationError extends Error {
  constructor() { super('CONTENT_MODERATION_FAILED'); this.name = 'ModerationError'; }
}

export function moderateText(...texts: (string | null | undefined)[]): void {
  for (const text of texts) {
    if (!text) continue;
    for (const pat of BLOCKED_PATTERNS) {
      if (pat.test(text)) throw new ModerationError();
    }
  }
}
