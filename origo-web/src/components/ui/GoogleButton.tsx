import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';

// PSEUDO: VITE_GOOGLE_CLIENT_ID must be set in .env
// Get it from: console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client IDs
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }): void;
          renderButton(element: HTMLElement, options: object): void;
          prompt(): void;
        };
      };
    };
  }
}

export default function GoogleButton() {
  const btnRef = useRef<HTMLDivElement>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!CLIENT_ID || !window.google?.accounts?.id || !btnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async ({ credential }) => {
        try {
          const { data } = await authApi.googleAuth(credential);
          setAuth(data.user, data.accessToken, data.refreshToken);
          if (data.user.isVerified) {
            // Signed in with a resolvable college Google Workspace account —
            // the backend already verified them from the hosted-domain claim.
            toast.success(`Signed in with Google — welcome, ${data.user.collegeName ?? 'verified student'}!`);
            navigate('/app/discover', { replace: true });
          } else {
            // Personal Google account (e.g. gmail.com) — still needs to prove
            // college affiliation like the email/password signup path does.
            toast.success('Signed in with Google! One more step — verify your college email.');
            navigate('/verify-college', { replace: true });
          }
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
          toast.error(msg === 'ACCOUNT_DISABLED' ? 'Your account has been disabled.' : 'Google sign-in failed. Try again.');
        }
      },
    });

    window.google.accounts.id.renderButton(btnRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: btnRef.current.offsetWidth || 340,
      shape: 'rectangular',
      text: 'continue_with',
    });
  }, [navigate, setAuth]);

  if (!CLIENT_ID) {
    return (
      <div className="w-full py-3 flex items-center justify-center gap-2 bg-muted border border-border rounded-xl text-text-muted text-sm cursor-not-allowed opacity-50">
        <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
          <path d="M43.6 20.1H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.6 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z" fill="#FFC107"/>
          <path d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.6 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" fill="#FF3D00"/>
          <path d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.3C29.4 35.1 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.9L6 33.1C9.3 39.6 16.1 44 24 44z" fill="#4CAF50"/>
          <path d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.4 5.7l.1-.1 6.3 5.3C36.9 40.7 44 35 44 24c0-1.3-.1-2.7-.4-3.9z" fill="#1976D2"/>
        </svg>
        Google Sign-In (add VITE_GOOGLE_CLIENT_ID to .env)
      </div>
    );
  }

  return <div ref={btnRef} className="w-full" />;
}
