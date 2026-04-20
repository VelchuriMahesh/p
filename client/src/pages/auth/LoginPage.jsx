import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { googleSignIn, loginWithEmail } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { getRouteForRole } from '../../utils/navigation';

export default function LoginPage() {
  const navigate = useNavigate();
  const { role, refreshProfile } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (role) navigate(getRouteForRole(role), { replace: true });
  }, [role, navigate]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await loginWithEmail(form);
      await refreshProfile(result.user);
      navigate(getRouteForRole(result.role), { replace: true });
    } catch (loginError) {
      setError(
        loginError.message.includes('invalid-credential') ||
        loginError.message.includes('wrong-password') ||
        loginError.message.includes('user-not-found')
          ? 'Invalid email or password.'
          : loginError.message || 'Sign in failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await googleSignIn();
      await refreshProfile(result.user);
      navigate(getRouteForRole(result.role), { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-accent/20 text-accent mb-4">
            <HeartHandshake className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Celebrate With Purpose</h1>
          <p className="mt-2 text-sm text-white/60">Sign in to start making a difference</p>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow-2xl">
          {/* Google sign in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 text-sm font-bold text-navy hover:bg-slate-50 transition-colors disabled:opacity-70"
          >
            {googleLoading ? (
              <div className="h-5 w-5 rounded-full border-2 border-navy border-t-transparent animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-muted font-semibold">or sign in with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email address"
                required
                className="min-h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                required
                className="min-h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-12 text-sm outline-none focus:border-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="min-h-12 w-full rounded-2xl bg-accent text-sm font-bold text-white disabled:opacity-70 transition-opacity"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            New here?{' '}
            <Link to="/register" className="font-bold text-accent">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}