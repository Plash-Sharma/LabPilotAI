import React, { useEffect, useState } from 'react';
import { api, Submission, VivaQuestion } from '../api/client';
import { HelpCircle, RefreshCw } from 'lucide-react';

export default function VivaPrep() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [questions, setQuestions] = useState<VivaQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getSubmissions()
      .then(subs => {
        const readySubs = subs.filter(s => s.status === 'ready');
        setSubmissions(readySubs);
        if (readySubs.length > 0) {
          setSelectedSubId(readySubs[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const handleFetchQuestions = async () => {
    if (!selectedSubId) return;
    setLoading(true);
    setQuestions([]);
    try {
      const q = await api.generateVivaQuestions(selectedSubId);
      setQuestions(q);
    } catch (err) {
      alert("Failed to generate questions. Ensure backend is running and API keys are set.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 dark:bg-gray-900 shadow dark:border dark:border-gray-700 sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
          <HelpCircle className="w-5 h-5 mr-2 text-blue-500" /> Viva Prep
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Select a previously created PDF to generate AI viva questions from its contents.</p>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
        <div className="max-w-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Lab Record</label>
          <div className="mt-1 flex space-x-3">
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            >
              {submissions.length === 0 && <option value="">No ready PDFs found</option>}
              {submissions.map(sub => {
                const title = sub.filename || sub.subject_of_lab || 'Lab Submission';
                const details = [sub.subject_of_lab, sub.date_of_lab].filter(Boolean).join(' | ');
                return (
                  <option key={sub.id} value={sub.id}>
                    {title}{details ? ` — ${details}` : ''}
                  </option>
                );
              })}
            </select>
            <button
              onClick={handleFetchQuestions}
              disabled={!selectedSubId || loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>

        {questions.length > 0 && (
          <div className="mt-8">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Practice Questions</h4>
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-blue-50 px-4 py-5 shadow-sm sm:rounded-lg border border-blue-100">
                  <h5 className="text-lg font-medium text-gray-900 dark:text-white">Question {idx + 1}</h5>
                  <div className="mt-2 text-base text-gray-800">
                    <p>{q.question_text}</p>
                  </div>
                  {q.answer_hint && (
                    <div className="mt-3 text-sm text-gray-600 italic border-l-4 border-blue-300 pl-3">
                      <p>Hint: {q.answer_hint}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
