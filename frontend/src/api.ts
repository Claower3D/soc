


export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    if ((window as any).__API_BASE__) {
      return (window as any).__API_BASE__;
    }
    if (
      window.location.hostname === 'appassets.androidplatform.net' ||
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && window.location.port !== '8080')
    ) {
      return 'https://soc-production-9d33.up.railway.app';
    }
  }
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
};

function getValidJwtToken(): string | null {
  try {
    const token = localStorage.getItem('new_age_jwt_token');
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) {
      localStorage.removeItem('new_age_jwt_token');
      return null;
    }
    const payload = JSON.parse(atob(parts[1]));
    if (payload && payload.exp && typeof payload.exp === 'number') {
      if (Date.now() >= payload.exp * 1000) {
        localStorage.removeItem('new_age_jwt_token');
        return null;
      }
    }
    return token;
  } catch {
    localStorage.removeItem('new_age_jwt_token');
    return null;
  }
}

/**
 * Базовая функция для выполнения запросов к API с обработкой ошибок и авторизацией.
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}, isMultipart = false): Promise<T> {
  const token = getValidJwtToken();
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

  if (response.status === 401) {
    localStorage.removeItem('new_age_jwt_token');
    localStorage.setItem('new_age_is_auth', 'false');
  }

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

import { dataCache } from './utils/dataCache';

export const api = {
  cache: {
    stats: () => dataCache.getStats(),
    clear: async () => {
      dataCache.clear();
      try {
        await apiFetch<any>('/api/cache/clear', { method: 'POST' });
      } catch {}
    },
    invalidate: (tag: string) => dataCache.invalidateTag(tag),
    prefetchAll: async () => {
      try {
        await Promise.allSettled([
          api.posts.list(),
          api.clips.list(),
          api.videos.list(),
          api.stories.list(),
          api.users.list(),
        ]);
      } catch {}
    }
  },
  auth: {
    register: (data: any) => apiFetch<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => apiFetch<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: async () => {
      const token = getValidJwtToken();
      if (!token) return { status: 'unauthenticated' };
      try {
        return await apiFetch<any>('/api/auth/me');
      } catch {
        return { status: 'unauthenticated' };
      }
    },
    checkUsername: (username: string) => apiFetch<any>(`/api/auth/check-username?username=${encodeURIComponent(username)}`),
    sendCode: (phone: string) => apiFetch<any>('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ phone }) }),
    verifyCode: (phone: string, code: string) => apiFetch<any>('/api/auth/verify-code', { method: 'POST', body: JSON.stringify({ phone, code }) })
  },
  users: {
    list: (forceRefresh = false) => dataCache.fetchWithCache('api:users:list', () => apiFetch<any>('/api/users'), { ttlMs: 90000, tag: 'users', forceRefresh }),
    search: (query: string) => apiFetch<any>(`/api/search?q=${encodeURIComponent(query)}`),
    profile: (id: string, forceRefresh = false) => dataCache.fetchWithCache(`api:users:${id}:profile`, () => apiFetch<any>(`/api/users/${id}/profile`), { ttlMs: 60000, tag: `user:${id}`, forceRefresh }),
    follow: async (id: string) => {
      const res = await apiFetch<any>(`/api/users/${id}/follow`, { method: 'POST' });
      dataCache.invalidateTag(`user:${id}`);
      dataCache.invalidateTag('users');
      return res;
    },
    unfollow: async (id: string) => {
      const res = await apiFetch<any>(`/api/users/${id}/follow`, { method: 'DELETE' });
      dataCache.invalidateTag(`user:${id}`);
      dataCache.invalidateTag('users');
      return res;
    },
    followers: (id: string) => apiFetch<any>(`/api/users/${id}/followers`),
    following: (id: string) => apiFetch<any>(`/api/users/${id}/following`),
    friends: (id: string) => apiFetch<any>(`/api/users/${id}/friends`),
    removeFriend: (id: string) => apiFetch<any>(`/api/users/${id}/friend`, { method: 'DELETE' }),
    updateProfile: async (data: any) => {
      const res = await apiFetch<any>('/api/profile', { method: 'PUT', body: JSON.stringify(data) });
      dataCache.invalidateTag('users');
      dataCache.invalidateTag('feed');
      return res;
    },
    heartbeat: () => apiFetch<any>('/api/users/heartbeat', { method: 'POST' }),
    offline: () => apiFetch<any>('/api/users/offline', { method: 'POST' })
  },
  posts: {
    list: (page?: number, forceRefresh = false) => {
      const key = page ? `api:feed:${page}` : 'api:feed:1';
      return dataCache.fetchWithCache(key, () => apiFetch<any>(page ? `/api/feed?page=${page}` : '/api/feed'), { ttlMs: 45000, tag: 'feed', forceRefresh });
    },
    userPosts: (userId: string, forceRefresh = false) => {
      return dataCache.fetchWithCache(`api:users:${userId}:posts`, () => apiFetch<any>(`/api/users/${userId}/posts`), { ttlMs: 60000, tag: `user:${userId}`, forceRefresh });
    },
    create: async (data: FormData | any) => {
      let res;
      if (data instanceof FormData) {
        res = await apiFetch<any>('/api/posts', { method: 'POST', body: data }, true);
      } else {
        res = await apiFetch<any>('/api/posts', { method: 'POST', body: JSON.stringify(data) });
      }
      dataCache.invalidateTag('feed');
      return res;
    },
    like: async (id: string) => {
      const res = await apiFetch<any>(`/api/posts/${id}/like`, { method: 'POST' });
      dataCache.invalidateTag('feed');
      return res;
    },
    unlike: async (id: string) => {
      const res = await apiFetch<any>(`/api/posts/${id}/like`, { method: 'DELETE' });
      dataCache.invalidateTag('feed');
      return res;
    },
    save: (id: string) => apiFetch<any>(`/api/posts/${id}/save`, { method: 'POST' }),
    comment: async (id: string, text: string) => {
      const res = await apiFetch<any>(`/api/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) });
      dataCache.invalidateTag('feed');
      return res;
    },
    comments: (id: string) => apiFetch<any>(`/api/posts/${id}/comments`),
    delete: async (id: string) => {
      const res = await apiFetch<any>(`/api/posts/${id}`, { method: 'DELETE' });
      dataCache.invalidateTag('feed');
      return res;
    }
  },
  stories: {
    list: (forceRefresh = false) => dataCache.fetchWithCache('api:stories:list', () => apiFetch<any>('/api/stories'), { ttlMs: 30000, tag: 'stories', forceRefresh }),
    create: async (formData: FormData) => {
      const res = await apiFetch<any>('/api/stories', { method: 'POST', body: formData }, true);
      dataCache.invalidateTag('stories');
      return res;
    },
    sync: async (stories: any[]) => {
      const res = await apiFetch<any>('/api/stories/sync', { method: 'POST', body: JSON.stringify(stories) });
      dataCache.invalidateTag('stories');
      return res;
    },
    delete: async (id: string) => {
      const res = await apiFetch<any>(`/api/stories/${id}`, { method: 'DELETE' });
      dataCache.invalidateTag('stories');
      return res;
    },
    view: (id: string) => apiFetch<any>(`/api/stories/${id}/view`, { method: 'POST' }),
    viewers: (id: string) => apiFetch<any>(`/api/stories/${id}/viewers`)
  },
  videos: {
    list: (forceRefresh = false) => dataCache.fetchWithCache('api:videos:list', () => apiFetch<any>('/api/videos'), { ttlMs: 60000, tag: 'videos', forceRefresh }),
    create: async (data: FormData | any) => {
      let res;
      if (data instanceof FormData) {
        res = await apiFetch<any>('/api/videos', { method: 'POST', body: data }, true);
      } else {
        res = await apiFetch<any>('/api/videos', { method: 'POST', body: JSON.stringify(data) });
      }
      dataCache.invalidateTag('videos');
      return res;
    },
    delete: async (id: string) => {
      const res = await apiFetch<any>(`/api/videos/${id}`, { method: 'DELETE' });
      dataCache.invalidateTag('videos');
      return res;
    },
    update: async (id: string, data: { title?: string; description?: string; category?: string }) => {
      const res = await apiFetch<any>(`/api/videos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      dataCache.invalidateTag('videos');
      return res;
    },
    like: async (id: string) => {
      const res = await apiFetch<any>(`/api/videos/${id}/like`, { method: 'POST' });
      dataCache.invalidateTag('videos');
      return res;
    },
    view: (id: string) => apiFetch<any>(`/api/videos/${id}/view`, { method: 'POST' })
  },
  clips: {
    list: (forceRefresh = false) => dataCache.fetchWithCache('api:clips:list', () => apiFetch<any>('/api/clips'), { ttlMs: 45000, tag: 'clips', forceRefresh }),
    create: async (data: FormData | any) => {
      let res;
      if (data instanceof FormData) {
        res = await apiFetch<any>('/api/clips', { method: 'POST', body: data }, true);
      } else {
        res = await apiFetch<any>('/api/clips', { method: 'POST', body: JSON.stringify(data) });
      }
      dataCache.invalidateTag('clips');
      return res;
    },
    delete: async (id: string) => {
      const res = await apiFetch<any>(`/api/clips/${id}`, { method: 'DELETE' });
      dataCache.invalidateTag('clips');
      return res;
    },
    update: async (id: string, data: { caption?: string; soundTitle?: string }) => {
      const res = await apiFetch<any>(`/api/clips/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      dataCache.invalidateTag('clips');
      return res;
    },
    like: async (id: string) => {
      const res = await apiFetch<any>(`/api/clips/${id}/like`, { method: 'POST' });
      dataCache.invalidateTag('clips');
      return res;
    },
    view: (id: string) => apiFetch<any>(`/api/clips/${id}/view`, { method: 'POST' }),
    share: (id: string) => apiFetch<any>(`/api/clips/${id}/share`, { method: 'POST' }),
    getComments: (id: string) => apiFetch<any>(`/api/clips/${id}/comments`),
    addComment: (id: string, text: string) => apiFetch<any>(`/api/clips/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) })
  },
  chats: {
    list: () => apiFetch<any>('/api/chats'),
    messages: (id: string) => apiFetch<any>(`/api/chats/${id}/messages`),
    send: (id: string, text: string, extra?: any) => apiFetch<any>(`/api/chats/${id}/messages`, { method: 'POST', body: JSON.stringify({ text, ...extra }) }),
    direct: (userId: string) => apiFetch<any>('/api/chats/direct', { method: 'POST', body: JSON.stringify({ userId }) }),
    createGroup: async (data: any) => {
      const res = await apiFetch<any>('/api/chats/group', { method: 'POST', body: JSON.stringify(data) });
      dataCache.invalidateTag('chats');
      return res;
    },
    delete: async (id: string) => {
      const res = await apiFetch<any>(`/api/chats/${id}`, { method: 'DELETE' });
      dataCache.invalidateTag('chats');
      return res;
    },
    read: (id: string) => apiFetch<any>(`/api/chats/${id}/read`, { method: 'POST' }),
  },
  podcasts: {
    list: (forceRefresh = false) => dataCache.fetchWithCache('api:podcasts:list', () => apiFetch<any>('/api/podcasts'), { ttlMs: 120000, tag: 'podcasts', forceRefresh })
  },
  marketplace: {
    products: (forceRefresh = false) => dataCache.fetchWithCache('api:marketplace:list', () => apiFetch<any>('/api/marketplace'), { ttlMs: 120000, tag: 'marketplace', forceRefresh })
  },
  communities: {
    list: (forceRefresh = false) => dataCache.fetchWithCache('api:communities:list', () => apiFetch<any>('/api/communities'), { ttlMs: 120000, tag: 'communities', forceRefresh }),
    join: async (id: string) => {
      const res = await apiFetch<any>(`/api/communities/${id}/join`, { method: 'POST' });
      dataCache.invalidateTag('communities');
      return res;
    }
  },
  wallet: {
    balance: () => apiFetch<any>('/api/wallet'),
    transactions: () => apiFetch<any>('/api/wallet/transactions')
  },
  geo: {
    detect: () => apiFetch<any>('/api/geo/detect')
  },
  notifications: {
    list: () => apiFetch<any>('/api/notifications'),
    markRead: (id?: string) => apiFetch<any>(id ? `/api/notifications/${id}/read` : '/api/notifications/read', { method: 'POST' }),
    delete: (id: string) => apiFetch<any>(`/api/notifications/${id}`, { method: 'DELETE' }),
    clearAll: () => apiFetch<any>('/api/notifications', { method: 'DELETE' }),
    sendTest: (type?: string) => apiFetch<any>('/api/notifications/test', { method: 'POST', body: JSON.stringify({ type }) })
  }
};
