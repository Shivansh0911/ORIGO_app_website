/**
 * Telemetry — the product/interaction data pipeline.
 * --------------------------------------------------
 * This is how Origo collects the *rich behavioural data our matching models need
 * to improve over time*. It is deliberately privacy-first:
 *
 *   • Opt-in only. Nothing is recorded or sent unless the user granted analytics
 *     consent (see consentStore). No consent → every call is a silent no-op.
 *   • Batched + resilient. Events buffer in memory + localStorage and flush in
 *     batches to POST /v1/events; failures are retried on the next flush, and the
 *     buffer is capped so it can't grow without bound.
 *   • Typed taxonomy. The event names below map directly to the training signals
 *     the matching roadmap depends on — especially discovery decisions and Rizz
 *     outcomes, which are the ground-truth labels for a learned ranker.
 *
 * WHERE DOES THIS DATA GO? The client only emits. Storage is a backend concern:
 * build POST /v1/events to write these into an append-only events table (Postgres
 * now; a warehouse later). Rizz-outcome events specifically should also populate
 * the model-training/outcome table. See docs/DATA_AND_PRIVACY.md.
 */

import { api } from '../api/client';
import { hasAnalyticsConsent } from '../store/consentStore';

export type EventName =
  // Discovery — the core interaction signal for the matching model
  | 'discover_impression'
  | 'discover_like'
  | 'discover_pass'
  | 'discover_rizz_start'
  | 'discover_intent_change'
  // Rizz — the ground-truth outcome labels
  | 'rizz_started'
  | 'rizz_message_sent'
  // Freshers growth loop
  | 'intro_card_created'
  | 'intro_card_shared'
  | 'prom_opt_in'
  | 'prom_opt_out'
  | 'quest_completed'
  | 'batch_joined'
  | 'we_met_added'
  // Navigation / discovery surfaces
  | 'page_view'
  | 'happening_click';

export interface TelemetryEvent {
  name: EventName;
  props?: Record<string, string | number | boolean | null>;
  ts: string;        // ISO timestamp
  sessionId: string; // per-tab session, not tied to identity here
}

const STORAGE_KEY = 'origo-telemetry-queue';
const MAX_BUFFER = 200;      // hard cap; drop oldest beyond this
const FLUSH_AT = 10;         // flush when buffer reaches this many
const FLUSH_INTERVAL_MS = 20_000;

const sessionId =
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;

let buffer: TelemetryEvent[] = loadBuffer();
let timer: ReturnType<typeof setInterval> | null = null;

function loadBuffer(): TelemetryEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TelemetryEvent[]) : [];
  } catch { return []; }
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer.slice(-MAX_BUFFER))); } catch { /* ignore */ }
}

/** Record an event. Silent no-op without analytics consent (opt-in). */
export function track(name: EventName, props?: TelemetryEvent['props']) {
  if (!hasAnalyticsConsent()) return;
  buffer.push({ name, props, ts: new Date().toISOString(), sessionId });
  if (buffer.length > MAX_BUFFER) buffer = buffer.slice(-MAX_BUFFER);
  persist();
  if (buffer.length >= FLUSH_AT) void flush();
  ensureTimer();
}

/** Send buffered events in one batch. Keeps them on failure for the next try. */
export async function flush(): Promise<void> {
  if (!hasAnalyticsConsent() || buffer.length === 0) return;
  const batch = buffer.slice(0, MAX_BUFFER);
  try {
    await api.post('/events', { events: batch });
    // Drop only what we sent; anything added meanwhile stays queued.
    buffer = buffer.slice(batch.length);
    persist();
  } catch {
    // Endpoint may not exist yet — keep the buffer and try again later.
  }
}

function ensureTimer() {
  if (timer) return;
  timer = setInterval(() => { void flush(); }, FLUSH_INTERVAL_MS);
}

/** Flush on tab hide/close so we don't lose the tail of a session. */
export function initTelemetry() {
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flush();
  });
  ensureTimer();
}

/** Clear everything (e.g. if the user withdraws consent). */
export function clearTelemetry() {
  buffer = [];
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
