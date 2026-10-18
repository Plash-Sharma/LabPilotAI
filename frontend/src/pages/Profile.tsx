import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { User, Hash, Mail, Building2, RefreshCw, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState<{name: string, email: string, college: string, roll_number: string | null} | null>(() => api.getCachedMe());
  const [loading, setLoading] = useState<boolean>(() => !api.getCachedMe());

  useEffect(() => {
    api.getMe()
      .then(res => {
        if (res && res.email) {
          setUser(res);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-colors">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Student Profile</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your institution & account information for lab reports</p>
            </div>
          </div>
          <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Active
          </span>
        </div>

        <div className="p-6">
          {loading && !user ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 flex justify-center items-center">
              <RefreshCw className="w-5 h-5 mr-2 animate-spin text-blue-500" /> Loading profile...
            </div>
          ) : (
            <dl className="divide-y divide-gray-100 dark:divide-gray-800/80">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 flex items-center">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Full Name
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {user?.name || 'N/A'}
                </dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 flex items-center">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center">
                  <Hash className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Roll Number
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {user?.roll_number || 'N/A'}
                </dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 flex items-center">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> Email Address
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {user?.email || 'N/A'}
                </dd>
              </div>

              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 flex items-center">
                <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> College
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {user?.college || 'N/A'}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
