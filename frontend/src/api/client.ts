export const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface Template {
  id: string;
  name: string;
  college_scope: string;
  layout_config: Record<string, unknown>;
}

export interface LabSession {
  id: string;
  subject: string;
  semester: string;
  user_id: string;
}

export interface Submission {
  id: string;
  aim: string;
  algorithm: string;
  code: string;
  output: string;
  result: string;
  template_id: string;
  lab_session_id: string | null;
  status: string;
  pdf_url: string | null;
  created_at: string;
  filename?: string | null;
  date_of_lab?: string | null;
  subject_of_lab?: string | null;
  subject_code?: string | null;
  group_name?: string | null;
  batch_name?: string | null;
  teacher_name?: string | null;
  include_logo?: boolean | null;
}

export interface SubmissionCreate {
  aim: string;
  algorithm: string;
  code: string;
  output: string;
  result: string;
  template_id: string;
  lab_session_id?: string;
  filename?: string;
  date_of_lab?: string;
  subject_of_lab?: string;
  subject_code?: string;
  group_name?: string;
  batch_name?: string;
  teacher_name?: string;
  include_logo?: boolean;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const config = {
    ...options,
    headers,
  };
  const res = await fetch(`${API_BASE}${endpoint}`, config);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return {} as T;
  }
  const text = await res.text();
  if (!text || !text.trim()) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export interface VivaQuestion {
  id: string;
  submission_id: string;
  question_text: string;
  answer_hint: string | null;
}

export interface MCQQuestionPublic {
  id: string;
  order_index: number;
  question_text: string;
  options: string[];
  difficulty: 'easy' | 'medium' | 'hard' | string;
  concept: string;
}

export interface MCQTest {
  id: string;
  submission_id: string;
  title: string;
  topic?: string | null;
  total_questions: number;
  created_at: string;
  questions: MCQQuestionPublic[];
  attempts_count?: number;
}

export interface MCQQuestionResult {
  id: string;
  order_index: number;
  question_text: string;
  options: string[];
  selected_index: number | null;
  correct_index: number;
  is_correct: boolean;
  explanation: string;
  difficulty: string;
  concept: string;
}

export interface MCQAttempt {
  id: string;
  test_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  level: string;
  feedback: string;
  analysis: {
    concept_breakdown?: Record<string, { correct: number; total: number }>;
    difficulty_breakdown?: Record<string, { correct: number; total: number }>;
    strengths?: string[];
    weaknesses?: string[];
    recommendation?: string;
  };
  questions: MCQQuestionResult[];
  created_at: string;
}

export interface MCQAttemptSummary {
  id: string;
  test_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  level: string;
  created_at: string;
}

export interface VivaChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VivaChatResponse {
  reply: string;
  suggested_prompts: string[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh

export function getCachedData<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

export function setCachedData<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        memoryCache.delete(key);
      }
    }
  }
}

export const api = {
  login: (email: string, password: string) => {
    clearCache();
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
  },
  register: (body: any) => {
    clearCache();
    return request<{ access_token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  },
  getMe: async (force = false): Promise<any> => {
    const cached = getCachedData<any>('user_me');
    if (cached && !force) {
      // background refresh
      request<any>('/auth/me').then((u) => setCachedData('user_me', u)).catch(() => {});
      return cached;
    }
    const res = await request<any>('/auth/me');
    setCachedData('user_me', res);
    return res;
  },
  getCachedMe: (): any | null => getCachedData<any>('user_me'),

  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, new_password: string) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) }),
  changePassword: async (old_password: string, new_password: string) => {
    const res = await request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify({ old_password, new_password }) });
    clearCache('user_me');
    return res;
  },

  getTemplates: async (force = false): Promise<Template[]> => {
    const cached = getCachedData<Template[]>('templates');
    if (cached && !force) return cached;
    const res = await request<Template[]>('/templates');
    setCachedData('templates', res);
    return res;
  },
  getCachedTemplates: (): Template[] | null => getCachedData<Template[]>('templates'),

  getSubmissions: async (force = false): Promise<Submission[]> => {
    const cached = getCachedData<Submission[]>('submissions');
    if (cached && !force) {
      // Background revalidation: fetch quietly so UI is always instantaneous
      request<Submission[]>('/submissions').then((subs) => {
        setCachedData('submissions', subs);
      }).catch(() => {});
      return cached;
    }
    const res = await request<Submission[]>('/submissions');
    setCachedData('submissions', res);
    return res;
  },
  getCachedSubmissions: (): Submission[] | null => getCachedData<Submission[]>('submissions'),

  createSubmission: async (body: SubmissionCreate) => {
    const res = await request<Submission>('/submissions', { method: 'POST', body: JSON.stringify(body) });
    clearCache('submissions');
    return res;
  },
  getSubmission: (id: string) => request<Submission>(`/submissions/${id}`),
  downloadPdfUrl: (id: string, filename?: string | null) => {
    const cleanName = filename ? (filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`) : 'lab-report.pdf';
    return `${API_BASE}/submissions/${id}/download/${encodeURIComponent(cleanName)}`;
  },
  viewPdfUrl: (id: string, filename?: string | null) => {
    const cleanName = filename ? (filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`) : 'lab-report.pdf';
    return `${API_BASE}/submissions/${id}/view/${encodeURIComponent(cleanName)}`;
  },
  downloadPdfBlob: async (id: string, filename?: string | null) => {
    const cleanName = filename ? (filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`) : 'lab-report.pdf';
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/submissions/${id}/download/${encodeURIComponent(cleanName)}`, { headers });
    if (!res.ok) throw new Error('Failed to download PDF');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
  },

  generateVivaQuestions: (id: string) =>
    request<VivaQuestion[]>(`/submissions/${id}/generate-questions`, { method: 'POST' }),
  getVivaQuestions: (id: string) =>
    request<VivaQuestion[]>(`/submissions/${id}/questions`),
  chatWithViva: (id: string, message: string, history: VivaChatMessage[] = []) =>
    request<VivaChatResponse>(`/submissions/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  // MCQ Test API
  generateMCQTest: async (submissionId: string, numQuestions: number = 10) => {
    const res = await request<MCQTest>(`/submissions/${submissionId}/mcq/generate`, {
      method: 'POST',
      body: JSON.stringify({ num_questions: numQuestions }),
    });
    clearCache(`mcq_tests_${submissionId}`);
    return res;
  },
  getSubmissionMCQTests: async (submissionId: string, force = false): Promise<MCQTest[]> => {
    const key = `mcq_tests_${submissionId}`;
    const cached = getCachedData<MCQTest[]>(key);
    if (cached && !force) {
      request<MCQTest[]>(`/submissions/${submissionId}/mcq/tests`).then((tests) => {
        setCachedData(key, tests);
      }).catch(() => {});
      return cached;
    }
    const res = await request<MCQTest[]>(`/submissions/${submissionId}/mcq/tests`);
    setCachedData(key, res);
    return res;
  },
  getCachedSubmissionMCQTests: (submissionId: string): MCQTest[] | null => 
    getCachedData<MCQTest[]>(`mcq_tests_${submissionId}`),

  getMCQTest: (testId: string) =>
    request<MCQTest>(`/mcq/tests/${testId}`),
  submitMCQTest: async (testId: string, selectedAnswers: Record<string, number>) => {
    const res = await request<MCQAttempt>(`/mcq/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ selected_answers: selectedAnswers }),
    });
    clearCache('mcq_tests_');
    return res;
  },
  getMCQTestAttempts: (testId: string) =>
    request<MCQAttemptSummary[]>(`/mcq/tests/${testId}/attempts`),
  getMCQAttempt: (attemptId: string) =>
    request<MCQAttempt>(`/mcq/attempts/${attemptId}`),
  deleteSubmission: async (id: string) => {
    const res = await request<void>(`/submissions/${id}`, { method: 'DELETE' });
    clearCache('submissions');
    clearCache(`mcq_tests_${id}`);
    return res;
  },
  deleteMCQTest: async (testId: string) => {
    const res = await request<void>(`/mcq/tests/${testId}`, { method: 'DELETE' });
    clearCache('mcq_tests_');
    return res;
  },
};

