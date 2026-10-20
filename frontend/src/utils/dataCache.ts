/**
 * New Age Smart Data Cache Engine (SWR + In-Memory + Persistent LocalStorage + Deduplication)
 * 
 * Features:
 * 1. Two-Tier Cache: L1 In-Memory Map (0ms access) + L2 Persistent LocalStorage
 * 2. Stale-While-Revalidate (SWR): Returns cached data instantly, refreshes in background
 * 3. Request Deduplication: In-flight promises share a single network call
 * 4. Tag-based Invalidation: Invalidate all 'feed', 'clips', 'user:*' entries on mutations
 * 5. Offline Resilience: Automatically serves cached responses when offline or network fails
 * 6. Cache Metrics & Statistics: Hits, misses, hit ratio %, estimated memory size
 */

export interface CacheOptions {
  ttlMs?: number; // Time-to-live in ms (default: 60,000ms = 1 minute)
  tag?: string; // Tag for group invalidation (e.g. 'feed', 'clips', 'videos', 'users')
  persist?: boolean; // Persist across sessions in localStorage (default: true)
  staleWhileRevalidate?: boolean; // Return stale cache immediately and update in background (default: true)
  forceRefresh?: boolean; // Ignore cache and fetch fresh from network
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  tag?: string;
  key: string;
}

export interface CacheStats {
  totalKeys: number;
  memoryKeys: number;
  persistentKeys: number;
  hits: number;
  misses: number;
  hitRatio: number;
  estimatedMemoryBytes: number;
  estimatedMemoryFormatted: string;
  inFlight: number;
  isOnline: boolean;
  tagsCount: Record<string, number>;
}

const STORAGE_PREFIX = 'newage_cache_v2_';
const MAX_PERSISTENT_ENTRIES = 150;

class SmartDataCache {
  private memoryCache = new Map<string, CacheEntry>();
  private inFlightRequests = new Map<string, Promise<any>>();
  private hits = 0;
  private misses = 0;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private subscribers = new Set<(stats: CacheStats) => void>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifySubscribers();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifySubscribers();
      });

      // Hydrate memory cache from localStorage on startup (top recent items)
      this.hydrateFromStorage();
    }
  }

  private hydrateFromStorage() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      const now = Date.now();
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          const entry: CacheEntry = JSON.parse(raw);
          if (entry && entry.expiresAt > now) {
            this.memoryCache.set(entry.key, entry);
          } else if (entry && now - entry.expiresAt > 24 * 60 * 60 * 1000) {
            // Clean up entries older than 24h
            localStorage.removeItem(k);
          }
        } catch {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.warn('[DataCache] Storage hydration notice:', e);
    }
  }

  /**
   * Get an entry from L1 (memory) or L2 (localStorage)
   */
  public get<T>(key: string): CacheEntry<T> | null {
    const now = Date.now();

    // Check L1: Memory Cache
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key) as CacheEntry<T>;
      if (entry.expiresAt > now) {
        this.hits++;
        return entry;
      }
      // Stale entry in memory
      return entry;
    }

    // Check L2: LocalStorage
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (raw) {
        const entry: CacheEntry<T> = JSON.parse(raw);
        if (entry) {
          // Promote to L1
          this.memoryCache.set(key, entry);
          if (entry.expiresAt > now) {
            this.hits++;
          }
          return entry;
        }
      }
    } catch {}

    this.misses++;
    return null;
  }

  /**
   * Set cache entry in L1 and optionally L2
   */
  public set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttlMs ?? 60 * 1000;
    const now = Date.now();
    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      expiresAt: now + ttl,
      tag: options.tag,
    };

    // L1: Memory
    this.memoryCache.set(key, entry);

    // L2: Persistent Storage
    if (options.persist !== false) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(entry));
        this.enforceStorageQuota();
      } catch (e) {
        // LocalStorage quota exceeded: clean expired entries
        this.cleanupExpiredStorage();
      }
    }

    this.notifySubscribers();
  }

  private enforceStorageQuota() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      if (keys.length > MAX_PERSISTENT_ENTRIES) {
        // Remove oldest entries
        const parsed = keys.map(k => {
          try {
            return { k, entry: JSON.parse(localStorage.getItem(k) || '{}') };
          } catch {
            return { k, entry: { timestamp: 0 } };
          }
        }).sort((a, b) => (a.entry.timestamp || 0) - (b.entry.timestamp || 0));

        const toRemove = parsed.slice(0, keys.length - MAX_PERSISTENT_ENTRIES);
        for (const item of toRemove) {
          localStorage.removeItem(item.k);
        }
      }
    } catch {}
  }

  private cleanupExpiredStorage() {
    try {
      const now = Date.now();
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const entry: CacheEntry = JSON.parse(raw);
            if (entry.expiresAt && entry.expiresAt < now) {
              localStorage.removeItem(k);
            }
          }
        } catch {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  }

  /**
   * Invalidate a single key
   */
  public invalidateKey(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {}
    this.notifySubscribers();
  }

  /**
   * Invalidate all entries tagged with specific tag (e.g. 'feed', 'clips')
   */
  public invalidateTag(tag: string): void {
    // Invalidate memory
    for (const [k, entry] of this.memoryCache.entries()) {
      if (entry.tag === tag || (tag.endsWith('*') && entry.tag?.startsWith(tag.slice(0, -1)))) {
        this.memoryCache.delete(k);
      }
    }

    // Invalidate localStorage
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const entry: CacheEntry = JSON.parse(raw);
            if (entry.tag === tag || (tag.endsWith('*') && entry.tag?.startsWith(tag.slice(0, -1)))) {
              localStorage.removeItem(k);
            }
          }
        } catch {}
      }
    } catch {}

    this.notifySubscribers();
  }

  /**
   * Wipe all cached data
   */
  public clear(): void {
    this.memoryCache.clear();
    this.inFlightRequests.clear();
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      for (const k of keys) {
        localStorage.removeItem(k);
      }
    } catch {}
    this.hits = 0;
    this.misses = 0;
    this.notifySubscribers();
  }

  /**
   * Stale-While-Revalidate (SWR) fetching with request deduplication
   */
  public async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {},
    onBackgroundUpdate?: (data: T) => void
  ): Promise<T> {
    const now = Date.now();
    const existing = this.get<T>(key);
    const swr = options.staleWhileRevalidate ?? true;
    const force = Boolean(options.forceRefresh);

    // If cache is fresh and not forcing refresh, return immediately
    if (existing && existing.expiresAt > now && !force) {
      return existing.data;
    }

    // If stale cache exists and SWR is active, return stale data immediately and revalidate in background
    if (existing && swr && !force) {
      this.revalidateInBackground(key, fetcher, options, onBackgroundUpdate);
      return existing.data;
    }

    // If offline and have stale data, always return stale data
    if (!this.isOnline && existing) {
      return existing.data;
    }

    // Request Deduplication: if request for key is already in flight, reuse it
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key)!;
    }

    const requestPromise = (async () => {
      try {
        const freshData = await fetcher();
        this.set(key, freshData, options);
        return freshData;
      } catch (err) {
        // Fallback to stale data if network request failed
        if (existing) {
          console.warn(`[DataCache] Network failed for ${key}, falling back to cache:`, err);
          return existing.data;
        }
        throw err;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, requestPromise);
    return requestPromise;
  }

  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions,
    onBackgroundUpdate?: (data: T) => void
  ) {
    if (!this.isOnline) return;
    if (this.inFlightRequests.has(key)) return;

    try {
      const p = fetcher();
      this.inFlightRequests.set(key, p);
      const freshData = await p;
      this.set(key, freshData, options);
      if (onBackgroundUpdate) {
        onBackgroundUpdate(freshData);
      }
      // Broadcast event so UI hooks can re-render seamlessly
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('newage_cache_updated', {
          detail: { key, tag: options.tag, data: freshData }
        }));
      }
    } catch (e) {
      // Background revalidation error is silently ignored
    } finally {
      this.inFlightRequests.delete(key);
    }
  }

  /**
   * Get current cache health and performance statistics
   */
  public getStats(): CacheStats {
    let persistentKeys = 0;
    let estimatedMemoryBytes = 0;
    const tagsCount: Record<string, number> = {};

    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      persistentKeys = keys.length;
      for (const k of keys) {
        const val = localStorage.getItem(k);
        if (val) estimatedMemoryBytes += val.length * 2; // UTF-16 approx
      }
    } catch {}

    for (const [, entry] of this.memoryCache) {
      if (entry.tag) {
        tagsCount[entry.tag] = (tagsCount[entry.tag] || 0) + 1;
      }
    }

    const total = this.hits + this.misses;
    const hitRatio = total > 0 ? (this.hits / total) * 100 : 100;

    const inFlight = this.inFlightRequests.size;
    const estimatedMemoryFormatted = estimatedMemoryBytes > 1024 * 1024 
      ? (estimatedMemoryBytes / (1024 * 1024)).toFixed(1) + ' MB'
      : (estimatedMemoryBytes / 1024).toFixed(1) + ' KB';

    return {
      totalKeys: Math.max(this.memoryCache.size, persistentKeys),
      memoryKeys: this.memoryCache.size,
      persistentKeys,
      hits: this.hits,
      misses: this.misses,
      hitRatio: Math.round(hitRatio * 10) / 10,
      estimatedMemoryBytes,
      estimatedMemoryFormatted,
      inFlight,
      isOnline: this.isOnline,
      tagsCount,
    };
  }

  public subscribe(cb: (stats: CacheStats) => void): () => void {
    this.subscribers.add(cb);
    cb(this.getStats());
    return () => this.subscribers.delete(cb);
  }

  private notifySubscribers() {
    const stats = this.getStats();
    for (const cb of this.subscribers) {
      try { cb(stats); } catch {}
    }
  }
}

export const dataCache = new SmartDataCache();
