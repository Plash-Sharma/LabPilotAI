import React, { useState } from 'react';
import { api } from '../api/client';
import { Key } from 'lucide-react';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const res = await api.changePassword(oldPassword, newPassword);
      setMsg(res.msg);
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 shadow sm:rounded-lg max-w-md mx-auto">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
          <Key className="w-5 h-5 mr-2 text-blue-500" /> Change Password
        </h3>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
          {msg && <div className="text-green-600 dark:text-green-400 text-sm">{msg}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Old Password</label>
            <input type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <button type="submit" disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
