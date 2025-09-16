export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  // @ts-ignore
  return res.text();
}

export const AuthAPI = {
  async signup(payload: { username: string; email: string; password: string; role?: string }) {
    return api<{ token: string; user: any }>(`/api/v1/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async login(payload: { email: string; password: string }) {
    return api<{ token: string; user: any }>(`/api/v1/auth/login`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  async me() {
    return api<{ success: boolean; user: any }>(`/api/v1/auth/me`, { method: 'GET' });
  },
};
