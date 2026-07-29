// SEC-10: text moderation applied to all user-generated free text.
// Uses `bad-words` npm package for English slurs, augmented with Hindi/Hinglish
// patterns that the library misses. Consider Rekognition / OpenAI Moderation for Phase 2.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Filter = require('bad-words');
const _filter = new Filter();

const EXTRA_PATTERNS = [
  /\bch[uo]tiy[ae]/i,
  /\bbh[oa]nc?ho?d/i,
  /\bm[ao]d[ae]rf[au]ck/i,
];

export class ModerationError extends Error {
  constructor() { super('CONTENT_MODERATION_FAILED'); this.name = 'ModerationError'; }
}

export function moderateText(...texts: (string | null | undefined)[]): void {
  for (const text of texts) {
    if (!text) continue;
    if (_filter.isProfane(text)) throw new ModerationError();
    for (const pat of EXTRA_PATTERNS) {
      if (pat.test(text)) throw new ModerationError();
    }
  }
}
