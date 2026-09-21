


const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Базовая функция для выполнения запросов к API с обработкой ошибок и авторизацией.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}, isMultipart = false): Promise<T> {
  const token = localStorage.getItem('new_age_jwt_token');
  const headers = new Headers(options.headers || {});
  
  if (!isMultipart && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }
    return {} as T;
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Ошибка запроса к API');
  }

  // Автоматически извлекаем .data из обёртки {status: "ok", data: ...}
  if (data && typeof data === 'object' && 'data' in data && data.status === 'ok') {
    return data.data;
  }

  return data;
}

export const api = {
  auth: {
    register: (data: any) => apiFetch<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => apiFetch<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => apiFetch<any>('/api/auth/me'),
    checkUsername: (username: string) => apiFetch<any>(`/api/auth/check-username?username=${encodeURIComponent(username)}`),
    sendCode: (phone: string) => apiFetch<any>('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ phone }) }),
    verifyCode: (phone: string, code: string) => apiFetch<any>('/api/auth/verify-code', { method: 'POST', body: JSON.stringify({ phone, code }) })
  },
  users: {
    list: () => apiFetch<any>('/api/users'),
    search: (query: string) => apiFetch<any>(`/api/search?q=${encodeURIComponent(query)}`),
    profile: (id: string) => apiFetch<any>(`/api/users/${id}/profile`),
    follow: (id: string) => apiFetch<any>(`/api/users/${id}/follow`, { method: 'POST' }),
    unfollow: (id: string) => apiFetch<any>(`/api/users/${id}/follow`, { method: 'DELETE' }),
    followers: (id: string) => apiFetch<any>(`/api/users/${id}/followers`),
    following: (id: string) => apiFetch<any>(`/api/users/${id}/following`),
    friends: (id: string) => apiFetch<any>(`/api/users/${id}/friends`),
    removeFriend: (id: string) => apiFetch<any>(`/api/users/${id}/friend`, { method: 'DELETE' }),
    updateProfile: (data: any) => apiFetch<any>('/api/profile', { method: 'PUT', body: JSON.stringify(data) })
  },
  posts: {
    list: () => apiFetch<any>('/api/feed'),
    userPosts: (userId: string) => apiFetch<any>(`/api/users/${userId}/posts`),
    create: (data: FormData | any) => {
      if (data instanceof FormData) {
        return apiFetch<any>('/api/posts', { method: 'POST', body: data }, true);
      }
      return apiFetch<any>('/api/posts', { method: 'POST', body: JSON.stringify(data) });
    },
    like: (id: string) => apiFetch<any>(`/api/posts/${id}/like`, { method: 'POST' }),
    unlike: (id: string) => apiFetch<any>(`/api/posts/${id}/like`, { method: 'DELETE' }),
    save: (id: string) => apiFetch<any>(`/api/posts/${id}/save`, { method: 'POST' }),
    comment: (id: string, text: string) => apiFetch<any>(`/api/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
    comments: (id: string) => apiFetch<any>(`/api/posts/${id}/comments`),
    delete: (id: string) => apiFetch<any>(`/api/posts/${id}`, { method: 'DELETE' })
  },
  stories: {
    list: () => apiFetch<any>('/api/stories'),
    create: (formData: FormData) => apiFetch<any>('/api/stories', { method: 'POST', body: formData }, true),
    sync: (stories: any[]) => apiFetch<any>('/api/stories/sync', { method: 'POST', body: JSON.stringify(stories) }),
    delete: (id: string) => apiFetch<any>(`/api/stories/${id}`, { method: 'DELETE' }),
    view: (id: string) => apiFetch<any>(`/api/stories/${id}/view`, { method: 'POST' })
  },
  videos: {
    list: () => apiFetch<any>('/api/videos'),
    create: (formData: FormData) => apiFetch<any>('/api/videos', { method: 'POST', body: formData }, true)
  },
  clips: {
    list: () => apiFetch<any>('/api/clips'),
    create: (data: any) => apiFetch<any>('/api/clips', { method: 'POST', body: JSON.stringify(data) }),
    like: (id: string) => apiFetch<any>(`/api/clips/${id}/like`, { method: 'POST' }),
    view: (id: string) => apiFetch<any>(`/api/clips/${id}/view`, { method: 'POST' })
  },
  chats: {
    list: () => apiFetch<any>('/api/chats'),
    messages: (id: string) => apiFetch<any>(`/api/chats/${id}/messages`),
    send: (id: string, text: string) => apiFetch<any>(`/api/chats/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) })
  },
  podcasts: {
    list: () => apiFetch<any>('/api/podcasts')
  },
  marketplace: {
    products: () => apiFetch<any>('/api/marketplace')
  },
  communities: {
    list: () => apiFetch<any>('/api/communities'),
    join: (id: string) => apiFetch<any>(`/api/communities/${id}/join`, { method: 'POST' })
  },
  wallet: {
    balance: () => apiFetch<any>('/api/wallet'),
    transactions: () => apiFetch<any>('/api/wallet/transactions')
  },
  geo: {
    detect: () => apiFetch<any>('/api/geo/detect')
  }
};
