const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  health: () => apiFetch('/api/health'),
  hello: () => apiFetch<{ message: string }>('/api/hello'),
};
