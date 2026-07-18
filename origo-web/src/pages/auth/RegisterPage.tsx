import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AtSign } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/endpoints';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { setOnboardingEmail } = useAuthStore();
  const navigate = useNavigate();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await authApi.register({ name: form.name, username: form.username, email: form.email, password: form.password });
      setOnboardingEmail(form.email);
      toast.success('OTP sent to your email!');
      navigate('/verify-otp');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      toast.error(msg ?? 'Registration failed. Try a different email/username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-text-primary mb-1">Join Origo</h2>
      <p className="text-text-muted text-sm mb-6">Start connecting with your campus</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full name" placeholder="Arjun Sharma" value={form.name} onChange={set('name')} icon={<User size={16} />} required />
        <Input label="Username" placeholder="arjun_sharma" value={form.username} onChange={set('username')} icon={<AtSign size={16} />} required />
        <Input label="Email" type="email" placeholder="you@gmail.com" value={form.email} onChange={set('email')} icon={<Mail size={16} />} required />
        <Input label="Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} icon={<Lock size={16} />} required />
        <Input label="Confirm password" type="password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} icon={<Lock size={16} />} required />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-text-muted text-sm mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
