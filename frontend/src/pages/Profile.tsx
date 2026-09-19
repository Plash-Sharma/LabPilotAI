import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { User as UserIcon, RefreshCw } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState<{name: string, email: string, college: string, roll_number: string | null} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe()
      .then(res => setUser(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 shadow sm:rounded-lg max-w-2xl mx-auto">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
          <UserIcon className="w-5 h-5 mr-2 text-blue-500" /> Student Profile
        </h3>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex justify-center items-center">
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Loading profile...
          </div>
        ) : (
          <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{user?.name || 'N/A'}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Roll Number</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{user?.roll_number || 'N/A'}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{user?.email || 'N/A'}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">College / Institution</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{user?.college || 'N/A'}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
