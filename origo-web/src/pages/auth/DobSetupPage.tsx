import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/endpoints';

export default function DobSetupPage() {
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  const maxDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const age = (Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) { toast.error('You must be 18 or older to use Origo'); return; }
    setLoading(true);
    try {
      await authApi.setDob({ dateOfBirth });
      if (user) setUser({ ...user, needsDob: false });
      toast.success('Date of birth saved!');
      navigate('/verify-college');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex items-center gap-2 mb-1">
        <Calendar size={22} className="text-primary" />
        <h2 className="text-xl font-bold text-text-primary">One quick thing</h2>
      </div>
      <p className="text-text-muted text-sm mb-6">Origo is for students 18+. Please confirm your date of birth.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date of birth"
          type="date"
          value={dateOfBirth}
          max={maxDate}
          onChange={(e) => setDateOfBirth(e.target.value)}
          icon={<Calendar size={16} />}
          required
        />
        <button
          type="submit"
          disabled={loading || !dateOfBirth}
          className="w-full py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </AuthLayout>
  );
}
