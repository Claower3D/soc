/**
 * Сервис многоуровневого кэширования платформы New Age (Cache Persistence Service).
 * Уровень 1 (L1): In-memory Map (мгновенный доступ 0ms в рамках сессии).
 * Уровень 2 (L2): localStorage с поддержкой TTL, контролем размера и безопасной сериализацией.
 * Уровень 3 (L3): Синхронизация с сервером (PostgreSQL system_cache / client_cache_sync).
 */

const CACHE_PREFIX = 'new_age_cache:';
const DEFAULT_TTL_SECONDS = 3600 * 24; // 24 часа по умолчанию

interface CacheEnvelope<T> {
  data: T;
  expiresAt: number | null; // unix timestamp в ms или null (бессрочно)
  createdAt: number;
  version: number;
  tag?: string;
}

export interface CacheStats {
  itemCount: number;
  totalSizeBytes: number;
  formattedSize: string;
  keys: string[];
}

class CacheService {
  private memoryCache = new Map<string, CacheEnvelope<any>>();

  constructor() {
    this.cleanupExpired();
  }

  private getKey(key: string): string {
    return key.startsWith(CACHE_PREFIX) ? key : `${CACHE_PREFIX}${key}`;
  }

  private stripKey(fullKey: string): string {
    return fullKey.replace(CACHE_PREFIX, '');
  }

  /**
   * Получить значение из кэша (L1 In-Memory -> L2 localStorage)
   */
  get<T>(key: string, fallback: T | null = null): T | null {
    const fullKey = this.getKey(key);

    // 1. Проверяем L1 (память)
    if (this.memoryCache.has(fullKey)) {
      const item = this.memoryCache.get(fullKey)!;
      if (item.expiresAt === null || item.expiresAt > Date.now()) {
        return item.data as T;
      }
      this.memoryCache.delete(fullKey);
    }

    // 2. Проверяем L2 (localStorage)
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return fallback;

      const envelope: CacheEnvelope<T> = JSON.parse(raw);
      if (envelope.expiresAt !== null && envelope.expiresAt <= Date.now()) {
        localStorage.removeItem(fullKey);
        return fallback;
      }

      // Подгружаем в L1 для последующего мгновенного доступа
      this.memoryCache.set(fullKey, envelope);
      return envelope.data;
    } catch (e) {
      console.warn(`[CacheService] Ошибка чтения ключа '${key}':`, e);
      return fallback;
    }
  }

  /**
   * Сохранить значение в кэш с TTL
   */
  set<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL_SECONDS, tag: string = 'general'): void {
    const fullKey = this.getKey(key);
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;

    const envelope: CacheEnvelope<T> = {
      data: value,
      expiresAt,
      createdAt: Date.now(),
      version: 1,
      tag
    };

    // 1. Запись в L1
    this.memoryCache.set(fullKey, envelope);

    // 2. Запись в L2
    try {
      localStorage.setItem(fullKey, JSON.stringify(envelope));
    } catch (e) {
      console.warn(`[CacheService] Квота localStorage исчерпана, запускаем очистку устаревших данных...`);
      this.cleanupExpired(true);
      try {
        localStorage.setItem(fullKey, JSON.stringify(envelope));
      } catch {
        // Оставляем хотя бы в памяти
      }
    }
  }

  /**
   * Получить из кэша, а при отсутствии — запросить по сети и сохранить в кэш
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = DEFAULT_TTL_SECONDS,
    tag: string = 'general'
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    try {
      const freshData = await fetcher();
      if (freshData !== null && freshData !== undefined) {
        this.set(key, freshData, ttlSeconds, tag);
      }
      return freshData;
    } catch (err) {
      // Если запрос упал, но в кэше было хоть что-то устаревшее — пробуем вернуть его
      const stale = this.get<T>(key);
      if (stale !== null) return stale;
      throw err;
    }
  }

  /**
   * Удалить ключ из кэша
   */
  remove(key: string): void {
    const fullKey = this.getKey(key);
    this.memoryCache.delete(fullKey);
    try {
      localStorage.removeItem(fullKey);
    } catch (e) {
      // Игнорируем ошибки доступа
    }
  }

  /**
   * Полная очистка кэша приложения (или по префиксу/тегу)
   */
  clear(filterPrefix?: string): void {
    this.memoryCache.clear();

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        if (!filterPrefix || k.includes(filterPrefix)) {
          keysToRemove.push(k);
        }
      }
    }

    keysToRemove.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  }

  /**
   * Статистика кэша (количество ключей и занимаемое место)
   */
  getStats(): CacheStats {
    let totalBytes = 0;
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keys.push(this.stripKey(k));
        const val = localStorage.getItem(k) || '';
        totalBytes += (k.length + val.length) * 2; // UTF-16 символы ~2 байта
      }
    }

    const formattedSize = totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(2)} МБ`
      : `${(totalBytes / 1024).toFixed(1)} КБ`;

    return {
      itemCount: keys.length,
      totalSizeBytes: totalBytes,
      formattedSize,
      keys
    };
  }

  /**
   * Очистить просроченные записи
   */
  private cleanupExpired(forceAggressive: boolean = false): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const envelope = JSON.parse(raw);
            if (envelope.expiresAt !== null && envelope.expiresAt <= now) {
              toRemove.push(k);
            } else if (forceAggressive && envelope.createdAt && now - envelope.createdAt > 3600 * 1000 * 48) {
              toRemove.push(k);
            }
          }
        } catch {
          toRemove.push(k);
        }
      }
    }

    toRemove.forEach(k => {
      this.memoryCache.delete(k);
      try {
        localStorage.removeItem(k);
      } catch {}
    });
  }
}

export const cacheService = new CacheService();
