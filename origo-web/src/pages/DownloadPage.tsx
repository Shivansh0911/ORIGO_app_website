import { Link } from 'react-router-dom';

export default function DownloadPage() {
  return (
    <main className="pt-16 min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md mx-auto">
        <div className="text-7xl mb-6">📱</div>

        <h1 className="text-4xl font-bold font-poppins text-white mb-4">
          App Coming <span className="gradient-text">Soon</span>
        </h1>

        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
          The Origo mobile app for iOS and Android is in the works.
          For now, use the web app — it works great on mobile too.
        </p>

        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white font-semibold font-poppins px-8 py-4 rounded-full text-base transition-all duration-200 shadow-lg shadow-primary/30"
        >
          <span>🚀</span>
          Open Web App
        </Link>

        <p className="text-text-muted text-sm mt-6">
          We'll notify early users when the app launches.
        </p>
      </div>
    </main>
  );
}
