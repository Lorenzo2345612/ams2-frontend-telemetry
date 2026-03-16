import { useState, type FormEvent, type FocusEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { changePassword } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ChangePasswordPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
  }>({});

  const validateCurrent = (value: string) => {
    if (!value) return 'Current password is required';
    return undefined;
  };

  const validateNew = (value: string) => {
    if (!value) return 'New password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return undefined;
  };

  const validateConfirm = (value: string) => {
    if (!value) return 'Please confirm your new password';
    if (value !== newPassword) return 'Passwords do not match';
    return undefined;
  };

  const handleBlur = (field: 'currentPassword' | 'newPassword' | 'confirmNewPassword') => (_e: FocusEvent) => {
    let err: string | undefined;
    if (field === 'currentPassword') err = validateCurrent(currentPassword);
    else if (field === 'newPassword') err = validateNew(newPassword);
    else err = validateConfirm(confirmNewPassword);
    setFieldErrors(prev => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const currentErr = validateCurrent(currentPassword);
    const newErr = validateNew(newPassword);
    const confirmErr = validateConfirm(confirmNewPassword);
    setFieldErrors({ currentPassword: currentErr, newPassword: newErr, confirmNewPassword: confirmErr });
    if (currentErr || newErr || confirmErr) return;

    setLoading(true);

    try {
      await changePassword(user?.email || '', currentPassword, newPassword);
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Change Password</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success banner */}
        {success && (
          <div
            className="flex items-center gap-2 p-3 rounded-lg text-sm animate-in fade-in duration-300"
            style={{
              backgroundColor: 'rgba(46, 125, 50, 0.15)',
              border: '1px solid rgba(46, 125, 50, 0.3)',
              color: '#66BB6A',
            }}
          >
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error banner */}
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

        {/* Email (read-only) */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm" style={{ color: '#888888' }}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            autoComplete="email"
            className="h-12 rounded-[10px] text-sm"
            style={{
              backgroundColor: '#1E1E1E',
              borderColor: '#444444',
              color: '#888888',
            }}
          />
        </div>

        {/* Current password */}
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword" className="text-sm" style={{ color: '#888888' }}>
            Current Password
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              placeholder="Enter current password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onBlur={handleBlur('currentPassword')}
              required
              className="h-12 rounded-[10px] text-sm text-white placeholder:text-zinc-500 pr-10 focus-visible:ring-1"
              style={{
                backgroundColor: '#1E1E1E',
                borderColor: fieldErrors.currentPassword ? '#DC143C' : '#444444',
              }}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
              tabIndex={-1}
            >
              {showCurrent ? (
                <Eye className="h-4 w-4" style={{ color: '#888888' }} />
              ) : (
                <EyeOff className="h-4 w-4" style={{ color: '#888888' }} />
              )}
            </button>
          </div>
          {fieldErrors.currentPassword && (
            <p className="text-xs pl-1" style={{ color: '#FF6B6B' }}>{fieldErrors.currentPassword}</p>
          )}
        </div>

        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-sm" style={{ color: '#888888' }}>
            New Password
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onBlur={handleBlur('newPassword')}
              required
              minLength={8}
              className="h-12 rounded-[10px] text-sm text-white placeholder:text-zinc-500 pr-10 focus-visible:ring-1"
              style={{
                backgroundColor: '#1E1E1E',
                borderColor: fieldErrors.newPassword ? '#DC143C' : '#444444',
              }}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
              tabIndex={-1}
            >
              {showNew ? (
                <Eye className="h-4 w-4" style={{ color: '#888888' }} />
              ) : (
                <EyeOff className="h-4 w-4" style={{ color: '#888888' }} />
              )}
            </button>
          </div>
          {fieldErrors.newPassword && (
            <p className="text-xs pl-1" style={{ color: '#FF6B6B' }}>{fieldErrors.newPassword}</p>
          )}
        </div>

        {/* Confirm new password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmNewPassword" className="text-sm" style={{ color: '#888888' }}>
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              id="confirmNewPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              onBlur={handleBlur('confirmNewPassword')}
              required
              minLength={8}
              className="h-12 rounded-[10px] text-sm text-white placeholder:text-zinc-500 pr-10 focus-visible:ring-1"
              style={{
                backgroundColor: '#1E1E1E',
                borderColor: fieldErrors.confirmNewPassword ? '#DC143C' : '#444444',
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
              tabIndex={-1}
            >
              {showConfirm ? (
                <Eye className="h-4 w-4" style={{ color: '#888888' }} />
              ) : (
                <EyeOff className="h-4 w-4" style={{ color: '#888888' }} />
              )}
            </button>
          </div>
          {fieldErrors.confirmNewPassword && (
            <p className="text-xs pl-1" style={{ color: '#FF6B6B' }}>{fieldErrors.confirmNewPassword}</p>
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
            'Change Password'
          )}
        </Button>
      </form>
    </div>
  );
}
