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

export const api = {
  login: (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
  },
  register: (body: any) => request<{ access_token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/auth/me'),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, new_password: string) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) }),
  changePassword: (old_password: string, new_password: string) => request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify({ old_password, new_password }) }),

  getTemplates: () => request<Template[]>('/templates'),
  getSubmissions: () => request<Submission[]>('/submissions'),
  createSubmission: (body: SubmissionCreate) =>
    request<Submission>('/submissions', { method: 'POST', body: JSON.stringify(body) }),
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
  generateMCQTest: (submissionId: string, numQuestions: number = 10) =>
    request<MCQTest>(`/submissions/${submissionId}/mcq/generate`, {
      method: 'POST',
      body: JSON.stringify({ num_questions: numQuestions }),
    }),
  getSubmissionMCQTests: (submissionId: string) =>
    request<MCQTest[]>(`/submissions/${submissionId}/mcq/tests`),
  getMCQTest: (testId: string) =>
    request<MCQTest>(`/mcq/tests/${testId}`),
  submitMCQTest: (testId: string, selectedAnswers: Record<string, number>) =>
    request<MCQAttempt>(`/mcq/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ selected_answers: selectedAnswers }),
    }),
  getMCQTestAttempts: (testId: string) =>
    request<MCQAttemptSummary[]>(`/mcq/tests/${testId}/attempts`),
  getMCQAttempt: (attemptId: string) =>
    request<MCQAttempt>(`/mcq/attempts/${attemptId}`),
  deleteSubmission: (id: string) =>
    request<void>(`/submissions/${id}`, { method: 'DELETE' }),
  deleteMCQTest: (testId: string) =>
    request<void>(`/mcq/tests/${testId}`, { method: 'DELETE' }),
};
