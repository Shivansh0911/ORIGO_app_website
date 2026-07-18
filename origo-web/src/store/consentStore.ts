/**
 * Consent state.
 * --------------
 * Origo is privacy-first, so product analytics are **opt-in**: nothing beyond
 * strictly-essential data is collected until the user explicitly accepts. This
 * store records that choice (persisted) and gates the telemetry layer.
 *
 * `version` lets us re-ask for consent if the policy materially changes.
 * When the backend gains a consent-log endpoint, `setConsent` should also POST
 * the decision so we have an auditable record (GDPR/DPDP-style). See
 * docs/DATA_AND_PRIVACY.md.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const CONSENT_VERSION = 1;

interface ConsentState {
  decided: boolean;
  analytics: boolean;      // product/behavioural analytics (opt-in)
  version: number;
  decidedAt: string | null;
  setConsent: (analytics: boolean) => void;
  reopen: () => void;      // let a user change their mind (from settings/privacy)
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      decided: false,
      analytics: false,
      version: CONSENT_VERSION,
      decidedAt: null,
      setConsent: (analytics) =>
        set({ decided: true, analytics, version: CONSENT_VERSION, decidedAt: new Date().toISOString() }),
      reopen: () => set({ decided: false }),
    }),
    { name: 'origo-consent' },
  ),
);

/** Non-hook accessor for the telemetry layer (which isn't a React component). */
export const hasAnalyticsConsent = () => useConsentStore.getState().analytics === true;
