import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { User, Post, Video, Clip, Chat, Story, Podcast, Product, Community } from '../data/mock';

/**
 * Хук для получения ленты постов
 */
export function useFeed(page?: number) {
  const [data, setData] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.posts.list();
      setData(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки ленты');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Хук для получения профиля пользователя
 */
export function useProfile(userId: string) {
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.users.profile(userId);
      setData(response.user || response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Хук для получения видео
 */
export function useVideos(category?: string) {
  const [data, setData] = useState<Video[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.videos.list();
      setData(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки видео');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Хук для получения клипов
 */
export function useClips() {
  const [data, setData] = useState<Clip[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.clips.list();
      setData(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки клипов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Хук для получения чатов
 */
export function useChats() {
  const [data, setData] = useState<Chat[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.chats.list();
      setData(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Хук для получения историй
 */
export function useStories() {
  const [data, setData] = useState<Story[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.stories.list();
      setData(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки историй');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Хук для получения подкастов
 */
export function usePodcasts() {
  const [data, setData] = useState<Podcast[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.podcasts.list();
      setData(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки подкастов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Хук для получения товаров маркетплейса
 */
export function useMarketplace() {
  const [data, setData] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.marketplace.products();
      setData(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки маркетплейса');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Хук для получения сообществ
 */
export function useCommunities() {
  const [data, setData] = useState<Community[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.communities.list();
      setData(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки сообществ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Хук для получения данных кошелька
 */
export function useWallet() {
  const [data, setData] = useState<any>(null); // Может содержать balance и transactions
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.wallet.balance();
      setData(response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки кошелька');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Хук для поиска пользователей
 */
export function useUserSearch(query: string) {
  const [data, setData] = useState<User[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!query) {
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.users.search(query);
      setData(response.users || response.data || response);
    } catch (err: any) {
      setError(err.message || 'Ошибка поиска пользователей');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      refetch();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [refetch]);

  return { data, loading, error, refetch };
}
