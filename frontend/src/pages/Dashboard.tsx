import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Download,
  ClipboardCheck,
  LayoutDashboard,
  FilePlus2,
  Calendar,
  GraduationCap,
  Eye,
  Trash2,
  XCircle,
} from 'lucide-react';
import { api, Submission } from '../api/client';
import { PdfModal } from '../components/PdfModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useToast } from '../contexts/ToastContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>(() => api.getCachedSubmissions() || []);
  const [loading, setLoading] = useState<boolean>(() => !api.getCachedSubmissions());
  const [selectedPdf, setSelectedPdf] = useState<{ id: string; filename?: string | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; filename?: string | null } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    api
      .getSubmissions()
      .then(setSubmissions)
      .catch((err) => console.error('Failed to load submissions', err))
      .finally(() => setLoading(false));
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteSubmission(deleteTarget.id);
      setSubmissions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success('Lab record and PDF deleted successfully.');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(`Failed to delete submission: ${err.message || err.toString()}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-gray-500 dark:text-gray-400 space-y-3">
        <Clock className="w-6 h-6 animate-spin text-blue-500" />
        <p className="text-sm">Loading lab records & test history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <LayoutDashboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Previous Lab Records</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View, download generated lab PDFs, and test your skills with on-the-spot AI MCQs.
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all space-x-2"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>Create New PDF</span>
        </Link>
      </div>

      {/* Submissions List */}
      <div className="bg-white dark:bg-gray-900 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
        {submissions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">No lab records found yet.</p>
            <p className="text-xs">Create your first lab record to generate PDFs and test your knowledge!</p>
            <Link
              to="/create"
              className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-gray-800 hover:bg-blue-100 transition-colors"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {submissions.map((sub) => (
              <li
                key={sub.id}
                className="p-5 sm:p-6 hover:bg-gray-50/80 dark:hover:bg-gray-850/60 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <span className="font-bold text-base text-gray-900 dark:text-white truncate">
                      {sub.filename || `Lab Record (${sub.id.substring(0, 8)})`}
                    </span>
                    {sub.batch_name && (
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md">
                        Batch: {sub.batch_name}
                      </span>
                    )}
                    {sub.group_name && (
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-md">
                        Group: {sub.group_name}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {sub.aim}
                  </p>

                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 pt-1 flex-wrap gap-y-1">
                    {sub.date_of_lab && (
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {sub.date_of_lab}
                      </span>
                    )}
                    {sub.subject_of_lab && (
                      <span className="flex items-center font-medium text-gray-700 dark:text-gray-300">
                        <GraduationCap className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {sub.subject_of_lab}
                      </span>
                    )}
                    {sub.teacher_name && <span>Teacher: {sub.teacher_name}</span>}
                    {!sub.date_of_lab && !sub.subject_of_lab && (
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2.5 self-end sm:self-center">
                  {sub.status === 'ready' ? (
                    <>
                      <button
                        onClick={() => setSelectedPdf({ id: sub.id, filename: sub.filename })}
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
                        title="View PDF record in browser"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => api.downloadPdfBlob(sub.id, sub.filename)}
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all"
                        title="Download PDF file"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => navigate('/mcq', { state: { submissionId: sub.id } })}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all shadow-sm"
                        title="Take MCQ test based on this lab"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
                        <span>Test</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: sub.id, filename: sub.filename })}
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 transition-all shadow-sm"
                        title="Delete lab record and PDF"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        <span>Delete</span>
                      </button>
                    </>
                  ) : sub.status === 'failed' ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-red-500 flex items-center px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                        <XCircle className="w-4 h-4 mr-1" /> PDF Failed
                      </span>
                      <button
                        onClick={() => setDeleteTarget({ id: sub.id, filename: sub.filename })}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete failed record"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        <span>Delete</span>
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 animate-pulse flex items-center px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                      <Clock className="w-4 h-4 mr-1 animate-spin" /> Processing PDF...
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PdfModal
        isOpen={Boolean(selectedPdf)}
        onClose={() => setSelectedPdf(null)}
        submissionId={selectedPdf?.id || ''}
        filename={selectedPdf?.filename}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Lab Record"
        itemName={deleteTarget?.filename}
        message="Are you sure you want to delete this lab record? This will permanently delete the PDF file, viva questions, and any associated MCQ tests."
        loading={isDeleting}
      />
    </div>
  );
}
