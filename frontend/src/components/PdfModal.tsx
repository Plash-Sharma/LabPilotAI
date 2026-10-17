import React, { useState, useEffect } from 'react';
import { X, ExternalLink, FileText, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';

interface PdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  filename?: string | null;
}

export const PdfModal: React.FC<PdfModalProps> = ({
  isOpen,
  onClose,
  submissionId,
  filename,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const displayTitle = filename ? (filename.endsWith('.pdf') ? filename : `${filename}.pdf`) : 'lab-report.pdf';
  const directUrl = api.viewPdfUrl(submissionId, filename);

  useEffect(() => {
    if (!isOpen || !submissionId) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${directUrl}?t=${Date.now()}`, { headers, cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load PDF`);
        return res.blob();
      })
      .then((blob) => {
        if (isMounted) {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          setBlobUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Error fetching PDF blob:', err);
          setError(err.message || 'Failed to render PDF');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, submissionId, directUrl]);

  if (!isOpen || !submissionId) return null;

  const handleDownload = () => {
    api.downloadPdfBlob(submissionId, filename).catch((err) => {
      console.error('Download failed:', err);
      window.open(api.downloadPdfUrl(submissionId, filename), '_blank');
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-850">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {displayTitle}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={blobUrl || directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-700 shadow-sm"
              title="Open in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              New Tab
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Body */}
        <div className="flex-1 w-full bg-gray-100 dark:bg-gray-950 p-1 sm:p-2 relative flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Loading PDF document...
              </span>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                Unable to display preview
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Download Instead
                </button>
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-700"
                >
                  Open in Tab
                </a>
              </div>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <iframe
              src={blobUrl}
              title={displayTitle}
              className="w-full h-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
};
