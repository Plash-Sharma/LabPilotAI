import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { api, API_BASE, Template, Submission, VivaQuestion } from '../api/client';
import { ArrowUp, ArrowDown, Trash2, Plus, Upload, Play, CheckCircle } from 'lucide-react';

interface Problem {
  id: string;
  question: string;
  code: string;
  language: string;
  stdin: string;
  output: string;
  isExecuting?: boolean;
}

export default function SubmitLab() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [problems, setProblems] = useState<Problem[]>([
    { id: Math.random().toString(36).substring(7), question: '', code: '', language: 'cpp', stdin: '', output: '' }
  ]);
  const [status, setStatus] = useState<'idle'|'loading'|'ready'|'failed'>('idle');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<VivaQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  const [dateOfLab, setDateOfLab] = useState('');
  const [subjectOfLab, setSubjectOfLab] = useState('OOPS LAB');
  const [subjectCode, setSubjectCode] = useState('CSDC0233');
  const [filename, setFilename] = useState('lab-report');
  const [groupName, setGroupName] = useState('');
  const [batchName, setBatchName] = useState('');
  const [teacherName, setTeacherName] = useState('');

  useEffect(() => {
    api.getTemplates()
      .then((data) => {
        setTemplates(data);
        if (data.length > 0) setTemplateId(data[0].id);
      })
      .catch(err => console.error("Failed to fetch templates", err));
  }, []);

  const handleProblemChange = (index: number, field: keyof Problem, value: string) => {
    const newProblems = [...problems];
    newProblems[index] = { ...newProblems[index], [field]: value };
    setProblems(newProblems);
  };

  const handleExecuteCode = async (index: number) => {
    const prob = problems[index];
    if (!prob.code.trim()) return;
    
    // Set executing state
    const newProblems = [...problems];
    newProblems[index] = { ...newProblems[index], isExecuting: true };
    setProblems(newProblems);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: prob.code,
          language: prob.language || 'cpp',
          stdin: prob.stdin || ''
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || 'Execution API Error'));
      }
      
      const newProbsAfter = [...problems];
      newProbsAfter[index] = { 
        ...newProbsAfter[index], 
        isExecuting: false, 
        output: data.stderr ? `Error:\n${data.stderr}\n\nOutput:\n${data.stdout || ''}` : (data.stdout || '')
      };
      setProblems(newProbsAfter);
    } catch (err) {
      const newProbsErr = [...problems];
      newProbsErr[index] = { ...newProbsErr[index], isExecuting: false, output: `Execution failed: ${err}` };
      setProblems(newProbsErr);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    let combinedCode = problems[index].code;
    for (const file of files) {
      const text = await file.text();
      const prefix = combinedCode ? '\n\n' : '';
      combinedCode += `${prefix}// --- File: ${file.name} ---\n${text}`;
    }
    handleProblemChange(index, 'code', combinedCode);
    e.target.value = '';
  };

  const addProblem = () => {
    setProblems([...problems, { id: Math.random().toString(36).substring(7), question: '', code: '', language: 'cpp', stdin: '', output: '' }]);
  };

  const removeProblem = (index: number) => {
    if (problems.length === 1) return;
    const newProblems = [...problems];
    newProblems.splice(index, 1);
    setProblems(newProblems);
  };

  const moveProblem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === problems.length - 1) return;
    const newProblems = [...problems];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newProblems[index], newProblems[swapIndex]] = [newProblems[swapIndex], newProblems[index]];
    setProblems(newProblems);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!templateId) {
      setError("Please select a template");
      return;
    }
    setError(null);
    setStatus('loading');
    try {
      const sub = await api.createSubmission({
        template_id: templateId,
        aim: 'MULTI_PROBLEM',
        algorithm: 'MULTI_PROBLEM',
        code: JSON.stringify(problems),
        output: 'MULTI_PROBLEM',
        result: 'MULTI_PROBLEM',
        date_of_lab: dateOfLab,
        subject_of_lab: subjectOfLab,
        subject_code: subjectCode,
        filename: filename,
        group_name: groupName,
        batch_name: batchName,
        teacher_name: teacherName
      });
      pollStatus(sub.id);
    } catch (err: any) {
      setError(err.toString());
      setStatus('failed');
    }
  };

  const pollStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const sub = await api.getSubmission(id);
        if (sub.status === 'ready' || sub.status === 'failed') {
          clearInterval(interval);
          setSubmission(sub);
          setStatus(sub.status as 'ready'|'failed');
        }
      } catch (err) {
        clearInterval(interval);
        setError("Failed to fetch status");
        setStatus('failed');
      }
    }, 2000);
  };

  const handleGenerateQuestions = async () => {
    if (!submission) return;
    setLoadingQuestions(true);
    try {
      const q = await api.generateVivaQuestions(submission.id);
      setQuestions(q);
    } catch (err: any) {
      setError("Failed to generate questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 dark:bg-gray-900 shadow dark:border dark:border-gray-700 sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">🧪 Create Lab Record</h1>
          <p className="text-gray-600 mb-6">Build your lab record by adding multiple problems as cards. You can shuffle them, upload code files, and generate a final PDF.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative mb-6">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Select Template Format</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            >
              {templates.length === 0 && <option value="">No templates — please wait or seed DB</option>}
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.college_scope})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Date of Lab</label>
              <input type="date" value={dateOfLab} onChange={e => setDateOfLab(e.target.value)}
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Subject of Lab</label>
              <input type="text" value={subjectOfLab} onChange={e => setSubjectOfLab(e.target.value)} placeholder="e.g. OOPS LAB"
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Subject Code</label>
              <input type="text" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="e.g. CSDC0233"
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Custom PDF Filename (Optional)</label>
              <input type="text" value={filename} onChange={e => setFilename(e.target.value)} placeholder="e.g. lab-report"
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Group Name</label>
              <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. CSE"
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Batch Name (Optional)</label>
              <input type="text" value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="e.g. G1"
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Teacher Name</label>
              <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="e.g. Dr. John Doe"
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>

          <div className="space-y-6">
            {problems.map((prob, idx) => (
              <div key={prob.id} className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800 overflow-hidden">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800">Problem {idx + 1}</h3>
                  <div className="flex space-x-2">
                    <button onClick={() => moveProblem(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-blue-600 disabled:opacity-30">
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <button onClick={() => moveProblem(idx, 'down')} disabled={idx === problems.length - 1} className="p-1 text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-blue-600 disabled:opacity-30">
                      <ArrowDown className="w-5 h-5" />
                    </button>
                    <button onClick={() => removeProblem(idx)} disabled={problems.length === 1} className="p-1 text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-red-600 disabled:opacity-30">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">Aim / Question</label>
                    <textarea
                      className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 border"
                      placeholder="Demonstrate the overloading of decrement operator..."
                      rows={2}
                      value={prob.question}
                      onChange={(e) => handleProblemChange(idx, 'question', e.target.value)}
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-4">
                        <label className="block text-sm font-medium text-gray-900 dark:text-white dark:text-white">Source Code</label>
                        <select 
                          value={prob.language || 'cpp'} 
                          onChange={(e) => handleProblemChange(idx, 'language', e.target.value)}
                          className="text-sm border-gray-300 dark:border-gray-700 rounded-md py-1 px-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="cpp">C++</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                        </select>
                      </div>
                      <label className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <Upload className="w-4 h-4 mr-1" /> Upload Files
                        <input type="file" multiple className="sr-only" onChange={(e) => handleFileUpload(e, idx)} />
                      </label>
                    </div>
                    <textarea
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 font-mono bg-white dark:bg-gray-800 text-sm resize-y"
                      rows={6}
                      placeholder="# Type your code or upload files..."
                      value={prob.code}
                      onChange={(e) => handleProblemChange(idx, 'code', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 flex items-center justify-between">
                        <span>Terminal Input (STDIN)</span>
                      </label>
                      <textarea
                        className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 font-mono bg-white dark:bg-gray-800 text-sm resize-y"
                        rows={4}
                        placeholder="Enter inputs expected by your program..."
                        value={prob.stdin || ''}
                        onChange={(e) => handleProblemChange(idx, 'stdin', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 flex items-center justify-between mb-1">
                        <span className="flex items-center"><Play className="w-4 h-4 mr-1" /> Output</span>
                        <button 
                          onClick={() => handleExecuteCode(idx)}
                          disabled={prob.isExecuting}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          {prob.isExecuting ? 'Running...' : 'Compile & Run'}
                        </button>
                      </label>
                      <textarea
                        className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 font-mono bg-gray-900 text-green-400 text-sm resize-y"
                        rows={4}
                        placeholder="Click Compile & Run or paste output here..."
                        value={prob.output}
                        onChange={(e) => handleProblemChange(idx, 'output', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={addProblem}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Another Problem
            </button>
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {status === 'loading' ? 'Generating PDF...' : 'Create PDF Record'}
            </button>
          </div>
        </div>

        {/* Status panel */}
        {status === 'ready' && submission && (
          <div className="bg-green-50 px-4 py-5 sm:p-6 border-t border-green-200">
            <h3 className="text-lg leading-6 font-medium text-green-800 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" /> PDF Generated Successfully!
            </h3>
            <div className="mt-5">
              <a
                href={api.downloadPdfUrl(submission.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Download Final PDF
              </a>
            </div>

            <div className="mt-8 border-t border-green-200 pt-6">
              <h4 className="text-md font-medium text-green-900">Viva Prep (from this Lab)</h4>
              <button 
                onClick={handleGenerateQuestions} 
                disabled={loadingQuestions}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900"
              >
                {loadingQuestions ? 'Generating...' : 'Generate Viva Questions'}
              </button>

              {questions.length > 0 && (
                <div className="mt-6 space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white dark:bg-gray-800 px-4 py-5 shadow sm:rounded-lg sm:p-6 border border-gray-200 dark:border-gray-700">
                      <h5 className="text-lg font-medium text-gray-900 dark:text-white dark:text-white">Question {idx + 1}</h5>
                      <div className="mt-2 text-base text-gray-700 dark:text-gray-300 dark:text-gray-300"><p>{q.question_text}</p></div>
                      {q.answer_hint && (
                        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 italic border-l-4 border-gray-200 dark:border-gray-700 pl-3">
                          <p>Hint: {q.answer_hint}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
