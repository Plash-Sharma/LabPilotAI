import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api/client';
import {
  Mail,
  Lock,
  User,
  Building2,
  Hash,
  Upload,
  LogIn,
  UserPlus,
  KeyRound,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { LabPilotLogo } from './LabPilotLogo';
import { PasswordRequirementsView, getPasswordValidationError } from './PasswordRequirements';

export interface AuthFormsProps {
  initialMode?: 'login' | 'register';
  onClose?: () => void;
  isModal?: boolean;
}

export function AuthForms({ initialMode = 'login', onClose, isModal = false }: AuthFormsProps = {}) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isForgot, setIsForgot] = useState(false);
  const { setToken } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  React.useEffect(() => {
    if (initialMode) {
      setIsLogin(initialMode === 'login');
    }
  }, [initialMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const isResetPath = window.location.pathname === '/reset-password';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError('Missing or invalid reset token. Please request a new password reset email.');
      return;
    }
    const pwError = getPasswordValidationError(newPassword);
    if (pwError) {
      setError(pwError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await api.resetPassword(resetToken, newPassword);
      setMsg((res.msg || 'Password has been reset successfully') + '. Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoBase64(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    setDevResetUrl('');
    try {
      const res = await api.forgotPassword(email);
      setMsg(res.msg || 'If an account exists with this email address, a password reset link has been sent to your inbox.');
      if (res.dev_reset_url) {
        setDevResetUrl(res.dev_reset_url);
      }
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await api.login(email, password);
        setToken(res.access_token);
        api.getMe().catch(() => {});
        if (onClose) onClose();
      } else {
        const pwError = getPasswordValidationError(password);
        if (pwError) {
          setError(pwError);
          setLoading(false);
          return;
        }
        const res = await api.register({
          email,
          password,
          name,
          college,
          roll_number: rollNumber,
          college_logo: logoBase64 || undefined,
        });
        api.setCachedMe({
          email,
          name,
          college,
          roll_number: rollNumber || null,
        });
        setToken(res.access_token);
        api.getMe().catch(() => {});
        if (onClose) onClose();
      }
    } catch (err: any) {
      let msg = err.detail || err.message || 'Authentication failed';
      if (typeof msg === 'string') {
        if (msg.includes('Incorrect email or password')) {
          msg = 'Incorrect email or password';
        } else if (msg.includes('API error')) {
          msg = msg.replace(/^API error \d+:\s*/, '');
          try {
            const p = JSON.parse(msg);
            if (p.detail) msg = p.detail;
          } catch {}
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const containerClass = isModal
    ? 'fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-md py-8 px-4 sm:px-6 transition-all'
    : 'h-full w-full overflow-y-auto flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-150';

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isModal && onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Top header with Theme Toggle and Close button
  const HeaderBar = () => (
    <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
      <button
        id="theme-toggle-auth-btn"
        type="button"
        onClick={toggleDarkMode}
        className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-sm transition-all flex items-center space-x-2 text-xs font-medium"
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
        <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white shadow-sm transition-all flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  if (isResetPath && !resetToken) {
    return (
      <div className={containerClass} onClick={handleBackdropClick}>
        <HeaderBar />
        <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invalid Reset Link</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            No reset token was found in the link. Please request a new password reset email from the sign-in page.
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Return to Sign In</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isResetPath && resetToken) {
    return (
      <div className={containerClass} onClick={handleBackdropClick}>
        <HeaderBar />
        <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/30">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter a secure new password for your account</p>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleResetSubmit}>
            {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs">{error}</div>}
            {msg && <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-300 text-xs">{msg}</div>}
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="New Password"
              />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm New Password"
              />
            </div>
            <PasswordRequirementsView password={newPassword} />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Resetting...' : 'Set New Password'}</span>
            </button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/';
                }}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (isForgot) {
    return (
      <div className={containerClass} onClick={handleBackdropClick}>
        <HeaderBar />
        <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/30">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter your registered email to receive a password reset link
            </p>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleForgotSubmit}>
            {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs">{error}</div>}
            {msg && (
              <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 text-xs">
                <div className="font-medium">{msg}</div>
              </div>
            )}
            {devResetUrl && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs space-y-2.5">
                <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span>Development Notice: SMTP Not Configured</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90">
                  SMTP credentials are not configured in <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 font-mono text-[10px]">backend/.env</code>, so no real email was dispatched. For testing, you can click the generated reset link below:
                </p>
                <div className="pt-1">
                  <a
                    href={devResetUrl}
                    className="block text-center w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors shadow-sm"
                  >
                    Open Password Reset Page
                  </a>
                </div>
              </div>
            )}
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email address"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
            </button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgot(false);
                  setError('');
                  setMsg('');
                  setDevResetUrl('');
                }}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass} onClick={handleBackdropClick}>
      <HeaderBar />

      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-colors">
        {/* Brand Logo & Title */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <LabPilotLogo size="xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isLogin ? 'Sign in to LabPilotAI' : 'Create Student Account'}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {isLogin
              ? 'Enter your credentials to access lab records and skill tests'
              : 'Generate automated lab PDFs and AI knowledge tests'}
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full Name"
                  />
                </div>

                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Roll Number (e.g. 21103001)"
                  />
                </div>

                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="College / Institution"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center">
                    <Upload className="w-3.5 h-3.5 mr-1 text-gray-400" /> College Logo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-xs text-gray-500 dark:text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 dark:file:bg-gray-800 file:text-gray-700 dark:file:text-gray-200 hover:file:bg-gray-200"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email address"
              />
            </div>

            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password"
              />
            </div>
            {!isLogin && <PasswordRequirementsView password={password} />}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>{loading ? 'Processing...' : isLogin ? 'Sign In' : 'Register Account'}</span>
          </button>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setMsg('');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {isLogin ? 'Need an account? Register' : 'Already registered? Sign in'}
            </button>
            {isLogin && (
              <button
                type="button"
                onClick={() => {
                  setIsForgot(true);
                  setError('');
                  setMsg('');
                  setDevResetUrl('');
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Forgot password?
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
