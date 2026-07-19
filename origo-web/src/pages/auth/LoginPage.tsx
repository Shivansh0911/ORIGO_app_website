import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { authApi, usersApi } from '../../api/endpoints';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await authApi.login({ email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/app/discover', { replace: true });
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      const fallbackMsg = err instanceof Error ? err.message : 'Login failed. Check your credentials.';
      toast.error(msg ?? fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-text-primary mb-1">Welcome back</h2>
      <p className="text-text-muted text-sm mb-6">Sign in to your Origo account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="College / personal email"
          type="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={16} />}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={16} />}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-text-muted text-sm mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
