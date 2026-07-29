/**
 * Matching / allocation configuration.
 * ------------------------------------
 * These govern how a scarce resource — the attention of the under-represented
 * side of a skewed campus — gets allocated. See docs/decisions/0003.
 *
 * Every value is env-overridable on purpose: the correct numbers are empirical
 * and will need tuning *during* freshers week, when a redeploy is the last
 * thing anyone wants to be doing.
 */

function int(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function bool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw === 'true' || raw === '1';
}

export const MATCHING = {
  /**
   * Max pending unanswered cold Rizz a user may hold. At capacity they stop
   * appearing in cold-contact discovery — replying, declining, or letting a
   * session expire frees a slot. This is the single mechanism that prevents
   * the minority side being flooded, so it is not an optimisation and must
   * not be removed to produce "more results".
   */
  inboundPendingCap: int(process.env['MATCH_INBOUND_CAP'], 3),

  /** Cold Rizz a non-premium user may start per day. */
  outboundDaily: int(process.env['MATCH_OUTBOUND_DAILY'], 3),

  /**
   * Premium uplift. MUST stay finite — selling uncapped cold contact on a
   * 75:25 campus is functionally selling the ability to flood people.
   */
  outboundDailyPremium: int(process.env['MATCH_OUTBOUND_DAILY_PREMIUM'], 6),

  /**
   * Consecutive messages an initiator may send before the target replies.
   * The 5-message budget stays; this stops it being burst into silence,
   * which from the receiving side is a wall of text from a stranger.
   */
  maxConsecutiveMessages: int(process.env['MATCH_MAX_CONSECUTIVE'], 2),

  /** Total initiator messages per Rizz session (the "Rizz In 5" budget). */
  rizzMessageBudget: int(process.env['MATCH_RIZZ_BUDGET'], 5),

  /** A decline is permanent — the initiator can never re-approach that person. */
  declineIsPermanent: bool(process.env['MATCH_DECLINE_PERMANENT'], true),

  /** Default and hard-max responses an author may accept on a Pulse. */
  pulseDefaultResponses: int(process.env['PULSE_DEFAULT_RESPONSES'], 3),
  pulseMaxResponses: int(process.env['PULSE_MAX_RESPONSES'], 10),
} as const;
