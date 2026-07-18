import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import { authApi } from '../../api/endpoints';

export default function CollegeVerifyPage() {
  const [collegeEmail, setCollegeEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      toast.success('College verified! ✓');
      navigate('/interests');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const skip = () => navigate('/interests');

  return (
    <AuthLayout>
      <div className="flex items-center gap-2 mb-1">
        <GraduationCap size={22} className="text-primary" />
        <h2 className="text-xl font-bold text-text-primary">Verify your college</h2>
      </div>
      <p className="text-text-muted text-sm mb-6">Use your college email to get a verified badge</p>

      {step === 'email' ? (
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
      ) : (
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
        </form>
      )}

      <button onClick={skip} className="w-full text-center text-text-muted text-sm mt-4 hover:text-text-secondary transition-colors">
        Skip for now →
      </button>
    </AuthLayout>
  );
}
