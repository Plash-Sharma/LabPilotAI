import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, CheckCircle, PlusCircle, Clock, XCircle } from 'lucide-react';
import { api, Submission } from '../api/client';

export default function Dashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSubmissions()
      .then(setSubmissions)
      .catch(err => console.error("Failed to load submissions", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading previous PDFs...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-900 shadow sm:rounded-lg dark:border dark:border-gray-700">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Previous Lab PDFs</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">View and download your previously generated lab records.</p>
        </div>
        <Link to="/create" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          Create New PDF
        </Link>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No lab records found. Click 'Create New PDF' to get started!
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {submissions.map((sub) => (
              <li key={sub.id} className="p-4 sm:px-6 hover:bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-500 mr-4" />
                    <div>
                      <p className="text-sm font-medium text-blue-600 truncate">{sub.filename || sub.subject_of_lab || 'Lab Submission'}</p>
                      <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-3">
                        {sub.date_of_lab && <span>Date: {sub.date_of_lab}</span>}
                        {sub.subject_of_lab && <span>Subject: {sub.subject_of_lab}</span>}
                        {sub.teacher_name && <span>Teacher: {sub.teacher_name}</span>}
                        {!sub.date_of_lab && !sub.subject_of_lab && !sub.teacher_name && (
                          <div className="flex items-center">
                            <Clock className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                            <span>Created {new Date(sub.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {sub.status === 'ready' ? (
                      <a
                        href={api.downloadPdfUrl(sub.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                      >
                        <Download className="w-4 h-4 mr-2" /> Download
                      </a>
                    ) : sub.status === 'failed' ? (
                      <span className="text-sm text-red-500 flex items-center"><XCircle className="w-4 h-4 mr-1"/> Failed</span>
                    ) : (
                      <span className="text-sm text-yellow-600 animate-pulse flex items-center"><Clock className="w-4 h-4 mr-1"/> Processing...</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
