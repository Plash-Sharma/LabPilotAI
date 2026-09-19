export const API_BASE = 'http://localhost:8080/api/v1';

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
  return res.json() as Promise<T>;
}

export interface VivaQuestion {
  id: string;
  submission_id: string;
  question_text: string;
  answer_hint: string | null;
}

export const api = {

  login: (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    return request<{access_token: string}>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
  },
  register: (body: any) => request<{access_token: string}>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/auth/me'),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, new_password: string) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) }),
  changePassword: (old_password: string, new_password: string) => request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify({ old_password, new_password }) }),

  getTemplates: () => request<Template[]>('/templates'),
  getSubmissions: () => request<Submission[]>('/submissions'),
  createSubmission: (body: SubmissionCreate) =>
    request<Submission>('/submissions', { method: 'POST', body: JSON.stringify(body) }),
  getSubmission: (id: string) => request<Submission>(`/submissions/${id}`),
  downloadPdfUrl: (id: string) => `${API_BASE}/submissions/${id}/download`,
  
  generateVivaQuestions: (id: string) => 
    request<VivaQuestion[]>(`/submissions/${id}/generate-questions`, { method: 'POST' }),
  getVivaQuestions: (id: string) => 
    request<VivaQuestion[]>(`/submissions/${id}/questions`),
};
