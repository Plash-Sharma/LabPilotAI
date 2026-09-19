import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

export function AuthForms() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const { setToken } = useAuth();
  
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
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await api.resetPassword(resetToken as string, newPassword);
      setMsg(res.msg + ". You can now login.");
      setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (isResetPath && resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border dark:border-gray-700">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Reset Password</h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleResetSubmit}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            {msg && <div className="text-green-500 text-sm text-center">{msg}</div>}
            <div className="rounded-md shadow-sm -space-y-px">
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="New Password"
              />
            </div>
            <div>
              <button type="submit" disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {loading ? 'Resetting...' : 'Set New Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files && e.target.files[0]);
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
      } else {
        const res = await api.register({
          email,
          password,
          name,
          college,
          roll_number: rollNumber,
          college_logo: logoBase64 || undefined
        });
        setToken(res.access_token);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (isForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border dark:border-gray-700">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">Forgot Password</h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Enter your email to receive a password reset link.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleForgotSubmit}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            {msg && <div className="text-green-500 text-sm text-center">{msg}</div>}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <button type="submit" disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
            <div className="text-center">
              <button type="button" onClick={() => setIsForgot(false)} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500">
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border dark:border-gray-700">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? 'Sign in to your account' : 'Register for LabPilotAI'}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <div className="rounded-md shadow-sm space-y-2">
            {!isLogin && (
              <>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
                <input type="text" required value={rollNumber} onChange={(e) => setRollNumber(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Roll Number"
                />
                <input type="text" required value={college} onChange={(e) => setCollege(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="College Name"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">College Logo (Optional)</label>
                  <input type="file" accept="image/*" onChange={handleLogoUpload}
                    className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200"
                  />
                </div>
              </>
            )}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>

          <div>
            <button type="submit" disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500">
              {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
            </button>
            {isLogin && (
              <button type="button" onClick={() => setIsForgot(true)} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500">
                Forgot password?
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
