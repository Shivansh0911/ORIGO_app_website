import { useConsentStore } from '../store/consentStore';

const UPDATED = 'July 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white font-poppins mb-3">{title}</h2>
      <div className="text-text-secondary text-sm leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  const { analytics, decided, reopen } = useConsentStore();

  return (
    <main className="pt-24 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
          🔒 PRIVACY
        </div>
        <h1 className="text-4xl font-bold text-white font-poppins mb-2">Privacy Policy</h1>
        <p className="text-text-muted text-sm mb-10">Last updated: {UPDATED}</p>

        <p className="text-text-secondary text-sm leading-relaxed mb-10">
          Origo is built for real students, and we treat your data the way we’d want ours treated. This
          policy explains what we collect, why, and the control you have. In plain terms: your data is
          yours, we don’t sell it, and analytics that help us improve are optional.
        </p>

        <Section title="1. Who we are">
          <p>
            Origo is operated by Origo Technologies Pvt. Ltd. (“Origo”, “we”, “us”). We are the data
            fiduciary/controller for the personal data described here. Contact:{' '}
            <a href="mailto:privacy@origo.app" className="text-primary hover:underline">privacy@origo.app</a>.
          </p>
        </Section>

        <Section title="2. What we collect">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong className="text-white">Account &amp; verification:</strong> name, username, email, college email (for student verification), and optionally a student ID for a verified badge.</li>
            <li><strong className="text-white">Profile:</strong> photo, bio, interests, gender, what you’re looking for, and content you post.</li>
            <li><strong className="text-white">Activity:</strong> matches, Rizz sessions, messages, communities, events, and — if you consent — how you use the app (screens viewed, likes/passes, features used).</li>
            <li><strong className="text-white">Device &amp; technical:</strong> device type, app version, and basic diagnostics needed to run the service securely.</li>
          </ul>
        </Section>

        <Section title="3. Why we use it">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To run the core service — verification, discovery, matching, messaging and communities.</li>
            <li>To <strong className="text-white">improve matching and recommendations</strong>. With your consent, we analyse interaction patterns (e.g. which connections lead to real conversations) to make suggestions better over time. This is how our models learn.</li>
            <li>To keep the community safe — detecting abuse, handling reports, and enforcing our rules.</li>
            <li>To communicate with you about the service.</li>
          </ul>
        </Section>

        <Section title="4. Your consent &amp; choices">
          <p>
            Analytics used to improve the product are <strong className="text-white">opt-in</strong>. Essential
            data needed to run the service and keep it safe is always processed, but optional analytics only
            happen if you accept. You can change your mind anytime.
          </p>
          <div className="mt-3 p-4 rounded-xl bg-card border border-border">
            <p className="text-white text-sm font-medium mb-1">Your current preference</p>
            <p className="text-text-muted text-sm mb-3">
              {decided ? (analytics ? 'Analytics: ON — thanks, this helps us improve matching.' : 'Analytics: OFF — essential only.') : 'Not set yet.'}
            </p>
            <button
              onClick={reopen}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-medium transition-colors"
            >
              Change data preferences
            </button>
          </div>
        </Section>

        <Section title="5. How we store &amp; protect it">
          <p>
            Data is stored on secured infrastructure, with data hosted in India where feasible. Sensitive
            fields are encrypted, access is restricted, and messages are protected in transit. No system is
            perfectly secure, but we work hard to keep yours safe.
          </p>
        </Section>

        <Section title="6. Sharing">
          <p>
            We do <strong className="text-white">not</strong> sell your personal data. We share it only with
            service providers who help us operate (e.g. hosting, email, payments), under contract and only as
            needed, and where legally required.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>You can, at any time:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Access and download your data.</li>
            <li>Correct your profile information.</li>
            <li>Delete your account and associated data.</li>
            <li>Withdraw analytics consent.</li>
          </ul>
          <p>To exercise these, use in-app settings or email <a href="mailto:privacy@origo.app" className="text-primary hover:underline">privacy@origo.app</a>.</p>
        </Section>

        <Section title="8. Retention">
          <p>
            We keep your data while your account is active. When you delete your account, we remove your
            personal data, keeping only what we must for legal, security or fraud-prevention reasons, in
            de-identified form where possible.
          </p>
        </Section>

        <Section title="9. Who can use Origo">
          <p>Origo is for verified college students. It is not intended for anyone under 18.</p>
        </Section>

        <Section title="10. Changes">
          <p>
            If we make material changes, we’ll update this page and, where appropriate, ask for your consent
            again. Continued use after an update means you accept the revised policy.
          </p>
        </Section>
      </div>
    </main>
  );
}
