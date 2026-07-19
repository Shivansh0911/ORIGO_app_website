import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AtSign } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import GoogleButton from '../../components/ui/GoogleButton';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/endpoints';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth, setOnboardingEmail } = useAuthStore();
  const navigate = useNavigate();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2 || form.name.length > 60) {
      toast.error('Name must be between 2 and 60 characters');
      return;
    }
    if (form.username.length < 3 || form.username.length > 20) {
      toast.error('Username must be between 3 and 20 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(form.username)) {
      toast.error('Username must contain only lowercase letters, numbers, and underscores');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(form.password)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      toast.error('Password must contain at least one number');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authApi.register({ name: form.name, username: form.username, email: form.email, password: form.password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Account created successfully!');
      navigate('/verify-college');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const resData = (err as { response?: { data?: { error?: string; fields?: Record<string, string[]> } } }).response?.data;
      if (resData?.fields) {
        const details = Object.entries(resData.fields)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('\n');
        toast.error(`Validation failed:\n${details}`);
      } else if (resData?.error === 'EMAIL_TAKEN') {
        toast.error('This email is already registered. Please sign in instead.');
      } else if (resData?.error === 'USERNAME_TAKEN') {
        toast.error('This username is already taken. Please choose another username.');
      } else if (resData?.error) {
        toast.error(resData.error);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Registration failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-text-primary mb-1">Join Origo</h2>
      <p className="text-text-muted text-sm mb-4">Start connecting with your campus</p>

      {/* Google Sign-Up — fastest path */}
      <div className="mb-4">
        <GoogleButton />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted">or sign up with email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

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
