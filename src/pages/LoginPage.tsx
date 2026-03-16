import { useState, useRef, type FormEvent, type FocusEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, Gauge, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const { login } = useAuth();
  const navigate = useNavigate();
  const passwordRef = useRef<HTMLInputElement>(null);

  const validateEmail = (value: string) => {
    if (!value.trim()) return 'Email is required';
    if (!value.includes('@')) return 'Enter a valid email';
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    return undefined;
  };

  const handleBlur = (field: 'email' | 'password') => (_e: FocusEvent) => {
    const value = field === 'email' ? email : password;
    const validator = field === 'email' ? validateEmail : validatePassword;
    setFieldErrors(prev => ({ ...prev, [field]: validator(value) }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setFieldErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    setLoading(true);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#1A1A1A' }}>
      <div className="w-full" style={{ maxWidth: 400 }}>
        {/* App identity header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Gauge className="h-12 w-12" style={{ color: '#4169E1' }} />
          </div>
          <h1 className="text-[28px] font-bold text-white">AMS2 Telemetry</h1>
          <p className="text-sm mt-1" style={{ color: '#888888' }}>Sign in to continue</p>
        </div>

        {/* Auth card */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: '#2A2A2A',
            border: '1px solid #3A3A3A',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Inline error banner */}
            {error && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg text-sm animate-in fade-in duration-300"
                style={{
                  backgroundColor: 'rgba(220, 20, 60, 0.1)',
                  border: '1px solid rgba(220, 20, 60, 0.3)',
                  color: '#FF6B6B',
                }}
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm" style={{ color: '#888888' }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleBlur('email')}
                required
                className="h-12 rounded-[10px] text-sm text-white placeholder:text-zinc-500 focus-visible:ring-1"
                style={{
                  backgroundColor: '#1E1E1E',
                  borderColor: fieldErrors.email ? '#DC143C' : '#444444',
                }}
              />
              {fieldErrors.email && (
                <p className="text-xs pl-1" style={{ color: '#FF6B6B' }}>{fieldErrors.email}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm" style={{ color: '#888888' }}>
                Password
              </Label>
              <div className="relative">
                <Input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handleBlur('password')}
                  required
                  className="h-12 rounded-[10px] text-sm text-white placeholder:text-zinc-500 pr-10 focus-visible:ring-1"
                  style={{
                    backgroundColor: '#1E1E1E',
                    borderColor: fieldErrors.password ? '#DC143C' : '#444444',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" style={{ color: '#888888' }} />
                  ) : (
                    <EyeOff className="h-4 w-4" style={{ color: '#888888' }} />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs pl-1" style={{ color: '#FF6B6B' }}>{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-[10px] text-base font-semibold text-white transition-opacity"
              style={{
                backgroundColor: '#4169E1',
                opacity: loading ? 0.4 : 1,
              }}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm mt-6" style={{ color: '#888888' }}>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: '#4169E1' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
