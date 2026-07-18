import { Link } from 'react-router-dom';
import { useConsentStore, CONSENT_VERSION } from '../../store/consentStore';

/**
 * Opt-in consent banner. Shown until the user decides (or when the policy
 * version bumps). "Essential only" keeps analytics off; "Accept" turns on
 * product analytics that help improve matching and the product. Either way the
 * app works fully — analytics are never required to use Origo.
 */
export default function ConsentBanner() {
  const { decided, version, setConsent } = useConsentStore();
  const show = !decided || version !== CONSENT_VERSION;
  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-5 sm:flex sm:items-center sm:gap-5">
        <div className="flex-1 mb-4 sm:mb-0">
          <p className="text-text-primary font-semibold text-sm mb-1">We keep your data yours 🔒</p>
          <p className="text-text-muted text-sm leading-relaxed">
            Origo collects some usage data to make matching and the product better. It’s optional —
            choose “Essential only” and everything still works. Read our{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setConsent(false)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-muted hover:bg-border text-text-secondary text-sm font-medium transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={() => setConsent(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
