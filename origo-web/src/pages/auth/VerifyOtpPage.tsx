import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/endpoints';

export default function VerifyOtpPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const { onboardingEmail, setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6 || !onboardingEmail) return;
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp({ email: onboardingEmail, otp });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Email verified!');
      navigate('/verify-college');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!onboardingEmail) return;
    try { await authApi.resendOtp(onboardingEmail); toast.success('OTP resent!'); } catch { toast.error('Failed to resend'); }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-text-primary mb-1">Verify your email</h2>
      <p className="text-text-muted text-sm mb-6">Enter the 6-digit code sent to <span className="text-text-primary">{onboardingEmail}</span></p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-2 justify-center">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-14 text-center text-xl font-bold bg-muted border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || digits.join('').length !== 6}
          className="w-full py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>

      <button onClick={resend} className="w-full text-center text-text-muted text-sm mt-4 hover:text-primary transition-colors">
        Resend code
      </button>
    </AuthLayout>
  );
}
