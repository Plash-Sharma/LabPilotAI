import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api/client';
import {
  Computer,
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
} from 'lucide-react';
import { PasswordRequirementsView, getPasswordValidationError } from './PasswordRequirements';

export function AuthForms() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const { setToken } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const isResetPath = window.location.pathname === '/reset-password';
  const [newPassword, setNewPassword] = useState('');

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = getPasswordValidationError(newPassword);
    if (pwError) {
      setError(pwError);
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await api.resetPassword(resetToken as string, newPassword);
      setMsg(res.msg + '. You can now login.');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password');
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
    try {
      const res = await api.forgotPassword(email);
      setMsg(res.msg);
    } catch (err: any) {
      setError('Failed to send reset email');
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
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Top header with Theme Toggle
  const HeaderBar = () => (
    <div className="absolute top-4 right-4 flex items-center space-x-2">
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
    </div>
  );

  if (isResetPath && resetToken) {
    return (
      <div className="h-full w-full overflow-y-auto flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-150">
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
            <PasswordRequirementsView password={newPassword} />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Resetting...' : 'Set New Password'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isForgot) {
    return (
      <div className="h-full w-full overflow-y-auto flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-150">
        <HeaderBar />
        <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/30">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter your registered email to receive a reset token
            </p>
          </div>
          <form className="mt-6 space-y-4" onSubmit={handleForgotSubmit}>
            {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs">{error}</div>}
            {msg && <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-300 text-xs">{msg}</div>}
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
                onClick={() => setIsForgot(false)}
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
    <div className="h-full w-full overflow-y-auto flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-150">
      <HeaderBar />

      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-colors">
        {/* Brand Logo & Title */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/30">
            <Computer className="w-6 h-6" />
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
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {isLogin ? 'Need an account? Register' : 'Already registered? Sign in'}
            </button>
            {isLogin && (
              <button
                type="button"
                onClick={() => setIsForgot(true)}
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
