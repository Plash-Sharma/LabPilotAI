import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_BASE, Template, Submission } from '../api/client';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Upload,
  Play,
  CheckCircle,
  ClipboardCheck,
  AlertCircle,
  Computer,
  Calendar,
  GraduationCap,
  FileText,
  Hash,
  Users,
  User,
  Code2,
  Download,
  Eye,
  Check,
  X,
  Image,
} from 'lucide-react';
import { PdfModal } from '../components/PdfModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { useToast } from '../contexts/ToastContext';

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
  const navigate = useNavigate();
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>(() => api.getCachedTemplates() || []);
  const [templateId, setTemplateId] = useState(() => {
    const cached = api.getCachedTemplates();
    return cached && cached.length > 0 ? cached[0].id : '';
  });
  const [problems, setProblems] = useState<Problem[]>([
    { id: Math.random().toString(36).substring(7), question: '', code: '', language: 'cpp', stdin: '', output: '' }
  ]);
  const [status, setStatus] = useState<'idle'|'loading'|'ready'|'failed'>('idle');
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewPdfModal, setViewPdfModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [dateOfLab, setDateOfLab] = useState('');
  const [subjectOfLab, setSubjectOfLab] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [filename, setFilename] = useState('');
  const [groupName, setGroupName] = useState('');
  const [batchName, setBatchName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [existingFiles, setExistingFiles] = useState<string[]>(() => {
    const cached = api.getCachedSubmissions();
    return cached ? cached.map((s) => (s.filename || '').trim().toLowerCase()).filter(Boolean) : [];
  });

  useEffect(() => {
    api.getSubmissions()
      .then((subs) => {
        setExistingFiles(
          subs
            .map((s) => (s.filename || '').trim().toLowerCase())
            .filter(Boolean)
        );
      })
      .catch(() => {});
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

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!templateId) {
      setError("Please select a template format.");
      return;
    }

    if (!dateOfLab.trim()) {
      setError("Please enter the Date of Lab.");
      return;
    }

    if (!subjectOfLab.trim()) {
      setError("Please enter the Subject of Lab (e.g. Data Structures & Algorithms).");
      return;
    }

    if (!subjectCode.trim()) {
      setError("Please enter the Subject Code (e.g. CS201).");
      return;
    }

    const cleanFilename = filename.trim();
    if (!cleanFilename) {
      setError("Please enter the Lab File Name.");
      return;
    }

    if (existingFiles.includes(cleanFilename.toLowerCase())) {
      setError(`A file named "${cleanFilename}" already exists. Each lab report must have a unique file name.`);
      return;
    }

    if (!groupName.trim()) {
      setError("Please enter the Group Name (e.g. CSE).");
      return;
    }

    if (!teacherName.trim()) {
      setError("Please enter the Teacher Name (e.g. Dr. John Doe).");
      return;
    }

    if (!problems || problems.length === 0) {
      setError("Please add at least one question card.");
      return;
    }

    // Validate every problem question card
    for (let i = 0; i < problems.length; i++) {
      const p = problems[i];
      const pNum = i + 1;
      if (!p.question.trim()) {
        setError(`Problem ${pNum}: Please enter the Aim / Question statement.`);
        return;
      }
      if (!p.code.trim()) {
        setError(`Problem ${pNum}: Please enter the Source Code.`);
        return;
      }
      if (!p.output.trim()) {
        setError(`Problem ${pNum}: Please enter or compile & run to generate the Output.`);
        return;
      }
    }

    // Compute meaningful Aim from problem questions instead of dummy MULTI_PROBLEM
    const problemAims = problems
      .map((p, idx) => p.question.trim() ? (problems.length > 1 ? `Problem ${idx + 1}: ${p.question.trim()}` : p.question.trim()) : '')
      .filter(Boolean);
    const computedAim = problemAims.length > 0
      ? problemAims.join(' | ')
      : (subjectOfLab ? `${subjectOfLab} Experiment` : 'Lab Practical');

    setError(null);
    setStatus('loading');
    try {
      const sub = await api.createSubmission({
        template_id: templateId,
        aim: computedAim,
        algorithm: 'Step-by-step implementation for laboratory experiment',
        code: JSON.stringify(problems),
        output: problems.map((p, idx) => `[Output P${idx+1}]:\n${p.output}`).join('\n\n'),
        result: 'Program executed and results verified successfully.',
        date_of_lab: dateOfLab,
        subject_of_lab: subjectOfLab,
        subject_code: subjectCode,
        filename: cleanFilename,
        group_name: groupName,
        batch_name: batchName,
        teacher_name: teacherName,
        include_logo: includeLogo
      });
      pollStatus(sub.id);
    } catch (err: any) {
      setError(err.message || err.toString());
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
          if (sub.status === 'ready') {
            toast.success('Your lab PDF was generated successfully!', 'Success');
          } else {
            toast.error('Failed to generate PDF. Please try again.', 'Error');
          }
        }
      } catch (err) {
        clearInterval(interval);
        setError("Failed to fetch status");
        setStatus('failed');
      }
    }, 2000);
  };

  const handleConfirmDelete = async () => {
    if (!submission) return;
    setIsDeleting(true);
    try {
      await api.deleteSubmission(submission.id);
      const deletedName = (submission.filename || '').trim().toLowerCase();
      setExistingFiles(prev => prev.filter(f => f !== deletedName));
      setSubmission(null);
      setStatus('idle');
      setShowDeleteModal(false);
      toast.success('Lab record deleted successfully.');
    } catch (err: any) {
      const errMsg = `Failed to delete lab record: ${err.message || err.toString()}`;
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-2xl mb-8 overflow-hidden transition-colors">
        <div className="px-6 py-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Computer className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Lab Record</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Build your lab report with problems, source code, and outputs, then generate a PDF and skill tests.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-xs relative my-4">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="my-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Select Template Format</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="block w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {templates.length === 0 && <option value="">No templates — please wait or seed DB</option>}
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.college_scope})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-50/70 dark:bg-gray-850 p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" /> Date of Lab
              </label>
              <input type="date" value={dateOfLab} onChange={e => setDateOfLab(e.target.value)}
                     className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <GraduationCap className="w-3.5 h-3.5 mr-1 text-gray-400" /> Subject of Lab
              </label>
              <input type="text" value={subjectOfLab} onChange={e => setSubjectOfLab(e.target.value)} placeholder="e.g. Data Structures & Algorithms"
                     className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <Hash className="w-3.5 h-3.5 mr-1 text-gray-400" /> Subject Code
              </label>
              <input type="text" value={subjectCode} onChange={e => setSubjectCode(e.target.value)} placeholder="e.g. CS201"
                     className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1 text-gray-400" /> Lab File Name
                </label>
                {filename.trim() && (
                  existingFiles.includes(filename.trim().toLowerCase()) ? (
                    <span className="text-[11px] font-semibold text-red-500 dark:text-red-400">
                      Already taken
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      ✓ Available
                    </span>
                  )
                )}
              </div>
              <input
                type="text"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                placeholder="e.g. stack-lab-report"
                className={`block w-full px-3 py-2 bg-white dark:bg-gray-800 border rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 ${
                  filename.trim() && existingFiles.includes(filename.trim().toLowerCase())
                    ? 'border-red-500 focus:ring-red-500 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-700 focus:ring-blue-500'
                }`}
              />
              {filename.trim() && existingFiles.includes(filename.trim().toLowerCase()) && (
                <p className="text-[11px] text-red-500 dark:text-red-400 mt-1">
                  You already have a file with this name. Please use a unique file name.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-gray-400" /> Group Name
              </label>
              <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. CSE"
                     className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1 text-gray-400" /> Batch Name (Optional)
              </label>
              <input type="text" value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="e.g. G1"
                     className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-gray-400" /> Teacher Name
              </label>
              <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="e.g. Dr. John Doe"
                     className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                <span className="flex items-center">
                  <Image className="w-3.5 h-3.5 mr-1 text-gray-400" /> College Logo on Cover
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal">Optional</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIncludeLogo(true)}
                  className={`flex items-center justify-center py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    includeLogo
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/30'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                  title="Include college logo on the front page"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Logo (✓)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeLogo(false)}
                  className={`flex items-center justify-center py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    !includeLogo
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm ring-1 ring-rose-500/30'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                  title="Do not include college logo"
                >
                  <X className="w-3.5 h-3.5 mr-1.5 text-rose-600 dark:text-rose-400" />
                  <span>No Logo (✗)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {problems.map((prob, idx) => (
              <div key={prob.id} className="border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm bg-white dark:bg-gray-900 overflow-hidden transition-colors">
                <div className="bg-gray-50 dark:bg-gray-850 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                    <Code2 className="w-4 h-4 mr-2 text-blue-500" />
                    Problem {idx + 1}
                  </h3>
                  <div className="flex space-x-1.5">
                    <button onClick={() => moveProblem(idx, 'up')} disabled={idx === 0} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveProblem(idx, 'down')} disabled={idx === problems.length - 1} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeProblem(idx)} disabled={problems.length === 1} className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Aim / Question</label>
                    <textarea
                      className="block w-full text-sm bg-gray-50/60 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Demonstrate the implementation of a custom Stack using classes in C++..."
                      rows={2}
                      value={prob.question}
                      onChange={(e) => handleProblemChange(idx, 'question', e.target.value)}
                    />
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border border-gray-200 dark:border-gray-750">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-3">
                        <label className="block text-xs font-semibold text-gray-900 dark:text-white">Source Code</label>
                        <select 
                          value={prob.language || 'cpp'} 
                          onChange={(e) => handleProblemChange(idx, 'language', e.target.value)}
                          className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg py-1 px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="cpp">C++</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                        </select>
                      </div>
                      <label className="cursor-pointer inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all">
                        <Upload className="w-3.5 h-3.5 mr-1" /> Upload Files
                        <input type="file" multiple className="sr-only" onChange={(e) => handleFileUpload(e, idx)} />
                      </label>
                    </div>
                    <textarea
                      className="block w-full text-sm font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      rows={6}
                      placeholder="# Type your source code or upload files..."
                      value={prob.code}
                      onChange={(e) => handleProblemChange(idx, 'code', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Terminal Input (STDIN)
                      </label>
                      <textarea
                        className="block w-full text-sm font-mono bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        rows={4}
                        placeholder="Inputs expected by your program..."
                        value={prob.stdin || ''}
                        onChange={(e) => handleProblemChange(idx, 'stdin', e.target.value)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                          <Play className="w-3.5 h-3.5 mr-1 text-green-600 dark:text-green-400" /> Output
                        </label>
                        <button 
                          onClick={() => handleExecuteCode(idx)}
                          disabled={prob.isExecuting}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all disabled:opacity-50"
                        >
                          {prob.isExecuting ? 'Running...' : 'Compile & Run'}
                        </button>
                      </div>
                      <textarea
                        className="block w-full text-sm font-mono bg-gray-950 border border-gray-800 text-emerald-400 rounded-xl py-2 px-3 focus:outline-none resize-y"
                        rows={4}
                        placeholder="Execution output will appear here..."
                        value={prob.output}
                        onChange={(e) => handleProblemChange(idx, 'output', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 rounded-xl text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="mt-6 flex justify-between items-center pt-2">
            <button
              onClick={addProblem}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add
            </button>
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              className="inline-flex justify-center py-3 px-6 text-sm font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700 shadow-md transition-all disabled:opacity-50"
            >
              {status === 'loading' ? 'Generating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* Status panel */}
        {status === 'ready' && submission && (
          <div className="bg-emerald-50/60 dark:bg-gray-900 px-6 py-6 border-t border-emerald-200 dark:border-emerald-500/30">
            <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-400 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" /> PDF Generated Successfully!
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setViewPdfModal(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
              >
                <Eye className="w-4 h-4 mr-1.5" /> View
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 shadow-sm transition-all"
                title="Delete this lab record"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
              </button>
              <button
                onClick={() => api.downloadPdfBlob(submission.id, submission.filename)}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all"
              >
                <Download className="w-4 h-4 mr-1.5" /> Download
              </button>
              <button
                onClick={() => navigate('/mcq', { state: { submissionId: submission.id } })}
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm transition-all"
              >
                <ClipboardCheck className="w-4 h-4 mr-1.5" /> Test
              </button>
            </div>

            <PdfModal
              isOpen={viewPdfModal}
              onClose={() => setViewPdfModal(false)}
              submissionId={submission.id}
              filename={submission.filename}
            />

            <ConfirmDeleteModal
              isOpen={showDeleteModal}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={handleConfirmDelete}
              title="Delete Lab Record"
              itemName={submission.filename || 'Lab Report'}
              message="Are you sure you want to delete this lab report and its generated PDF? This action cannot be undone."
              loading={isDeleting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
