import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, GraduationCap, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import { authApi, usersApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';

export default function CollegeVerifyPage() {
  const [collegeEmail, setCollegeEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [collegeName, setCollegeName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.sendCollegeOtp({ collegeEmail });
      toast.success('OTP sent to your college email!');
      setStep('otp');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyCollegeOtp({ collegeEmail, otp });
      // Fetch updated profile so store reflects isVerified + collegeName
      const { data: updatedUser } = await usersApi.getMe();
      setUser(updatedUser);
      setCollegeName(updatedUser.collegeName ?? 'your campus');
      setStep('success');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!collegeEmail) return;
    setLoading(true);
    try {
      await authApi.sendCollegeOtp({ collegeEmail });
      toast.success('New OTP sent to your college email!');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      {step !== 'success' && (
        <>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap size={22} className="text-primary" />
            <h2 className="text-xl font-bold text-text-primary">Verify your college</h2>
          </div>
          <p className="text-text-muted text-sm mb-6">Use your college email to get a verified badge</p>
        </>
      )}

      {step === 'email' && (
        <form onSubmit={sendOtp} className="space-y-4">
          <Input
            label="College email"
            type="email"
            placeholder="you@iit.ac.in"
            value={collegeEmail}
            onChange={(e) => setCollegeEmail(e.target.value)}
            icon={<Mail size={16} />}
            required
          />
          <button type="submit" disabled={loading} className="w-full py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors disabled:opacity-60">
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyOtp} className="space-y-4">
          <Input
            label="6-digit OTP"
            type="text"
            inputMode="numeric"
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className="w-full py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors disabled:opacity-60">
            {loading ? 'Verifying…' : 'Verify College'}
          </button>
          <button
            type="button"
            onClick={resendOtp}
            disabled={loading}
            className="w-full text-center text-text-muted text-sm mt-2 hover:text-primary transition-colors"
          >
            Resend OTP code
          </button>
        </form>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center text-center py-4 gap-5">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">You're in!</h2>
            <p className="text-text-muted">Welcome to {collegeName} on Origo</p>
          </div>
          <button
            onClick={() => navigate('/interests')}
            className="w-full py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors"
          >
            Continue →
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
