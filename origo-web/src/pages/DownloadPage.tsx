import React, { useState } from 'react';

const FAQS = [
  { q: 'Is Origo free to use?', a: 'Yes! Core features are completely free forever. Premium unlocks advanced features like cross-campus discovery, unlimited Rizz sessions, and profile boosts.' },
  { q: 'How does college verification work?', a: 'Sign up with your college email (.edu.in or .ac.in). We send an OTP to verify you\'re a real student. You can also optionally upload your student ID for a stronger verified badge.' },
  { q: 'Is my data safe?', a: 'Absolutely. All personal data is encrypted with AES-256. We never sell your data to third parties. You can export or delete all your data at any time from Settings.' },
  { q: 'Can I use Origo if I\'ve already graduated?', a: 'Origo is exclusively for current students. Your account will be flagged for review if your college email expires or your enrollment ends.' },
  { q: 'Which colleges are supported?', a: 'We support all major Indian colleges with .edu.in, .ac.in, and institutional email domains. If your college isn\'t supported yet, contact us — we add new colleges every week.' },
];

function QRCode() {
  return (
    <div className="inline-grid grid-cols-7 gap-0.5 p-3 bg-white rounded-2xl">
      {Array.from({ length: 49 }, (_, i) => {
        const corners = [0, 1, 2, 7, 8, 9, 14, 15, 16, 32, 33, 34, 39, 40, 41, 46, 47, 48];
        const inner = [16, 22, 23, 24, 25, 26];
        const random = [3, 5, 10, 13, 17, 20, 27, 30, 35, 38, 43, 45];
        const filled = corners.includes(i) || inner.includes(i) || random.includes(i);
        return <div key={i} className={`w-4 h-4 rounded-sm ${filled ? 'bg-gray-900' : 'bg-white'}`} />;
      })}
    </div>
  );
}

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left bg-card hover:bg-muted transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-white font-medium">{q}</span>
        <span className={`text-primary text-xl transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-6 py-4 bg-muted/50">
          <p className="text-text-secondary leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function DownloadPage() {
  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="text-6xl mb-6">📱</div>
          <h1 className="text-5xl font-bold font-poppins text-white mb-4">
            Get <span className="gradient-text">Origo</span>
          </h1>
          <p className="text-text-secondary text-xl mb-12">Your campus social life starts here.</p>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {/* Google Play */}
            <a
              href="#"
              className="flex items-center gap-4 bg-card border border-border hover:border-primary rounded-2xl px-6 py-4 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                  <path d="M3.18 23.76c.37.21.8.26 1.21.13l12.54-7.23-2.69-2.68-11.06 9.78zM.29 1.27C.1 1.63 0 2.04 0 2.48v19.04c0 .44.1.85.29 1.21l.07.07L10.77 12l-10.41-10.8-.07.07zM20.43 9.79l-2.76-1.59-3.07 3.07 3.07 3.07 2.79-1.61c.8-.46.8-1.48-.03-1.94zM4.39.11L16.93 7.34l-2.69 2.69L3.18.24C3.55.12 3.99.17 4.39.41z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-text-muted text-xs">Get it on</div>
                <div className="text-white font-bold text-lg font-poppins">Google Play</div>
                <div className="text-text-muted text-xs">Android 8.0+</div>
              </div>
            </a>

            {/* App Store */}
            <a
              href="#"
              className="flex items-center gap-4 bg-card border border-border hover:border-primary rounded-2xl px-6 py-4 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center flex-shrink-0 border border-gray-600">
                <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-text-muted text-xs">Download on the</div>
                <div className="text-white font-bold text-lg font-poppins">App Store</div>
                <div className="text-text-muted text-xs">iOS 14.0+</div>
              </div>
            </a>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-text-secondary text-sm">Or scan to download</p>
            <QRCode />
            <p className="text-text-muted text-xs">Point your camera at the QR code</p>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-12 px-6 bg-card/30">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { emoji: '🆓', title: 'Free Forever', desc: 'Core features always free. No credit card required.' },
            { emoji: '✅', title: '100% Verified', desc: 'Every student verified with their college email.' },
            { emoji: '🇮🇳', title: 'India First', desc: 'Built specifically for Indian campus culture.' },
          ].map((h) => (
            <div key={h.title} className="bg-card border border-border rounded-2xl p-6">
              <div className="text-4xl mb-3">{h.emoji}</div>
              <h3 className="text-white font-bold text-lg font-poppins mb-2">{h.title}</h3>
              <p className="text-text-muted text-sm">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold font-poppins text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <AccordionItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6 text-center bg-gradient-to-t from-primary/10 to-transparent">
        <p className="text-text-secondary mb-3">Still have questions?</p>
        <a href="mailto:hello@origo.app" className="text-primary hover:text-primary-light font-medium transition-colors">
          hello@origo.app
        </a>
      </section>
    </main>
  );
}
