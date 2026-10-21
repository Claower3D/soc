import { useState, useEffect, useCallback } from 'react';
import { 
  X, Database, Zap, RefreshCw, Trash2, CheckCircle2, 
  Wifi, WifiOff, HardDrive, Cpu, Layers, Sparkles, AlertCircle, Server
} from 'lucide-react';
import { dataCache, type CacheStats } from '../utils/dataCache';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './CacheManagerModal.css';

interface CacheManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServerCacheStats {
  cached_items_count: number;
  keys: string[];
  hits: number;
  misses: number;
  hit_rate_percent: string;
  db_system_cache_count?: number;
}

const CACHE_CATEGORIES = [
  { tag: 'feed', title: 'Лента публикаций', desc: 'Посты, фото, лайки и комментарии', icon: '📰' },
  { tag: 'clips', title: 'Клипы и Shorts', desc: 'Вертикальные видеоролики и треки', icon: '🎬' },
  { tag: 'videos', title: 'Видеоканал', desc: 'Горизонтальные видео и превью', icon: '📺' },
  { tag: 'stories', title: 'Истории (Stories)', desc: 'Суточные фото, видео и стикеры', icon: '✨' },
  { tag: 'users', title: 'Профили и авторы', desc: 'Карточки пользователей и аватары', icon: '👤' },
  { tag: 'communities', title: 'Сообщества', desc: 'Клубы, описания и участники', icon: '👥' },
  { tag: 'podcasts', title: 'Подкасты и аудио', desc: 'Аудиозаписи, выпуски и авторы', icon: '🎙️' },
  { tag: 'marketplace', title: 'Маркетплейс', desc: 'Товары, цены и каталог', icon: '🛍️' },
];

export function CacheManagerModal({ isOpen, onClose }: CacheManagerModalProps) {
  const [stats, setStats] = useState<CacheStats>(() => dataCache.getStats());
  const [serverStats, setServerStats] = useState<ServerCacheStats | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isClearingServer, setIsClearingServer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshStats = useCallback(() => {
    setStats(dataCache.getStats());
  }, []);

  const fetchServerStats = useCallback(async () => {
    try {
      const res = await fetch('/api/cache/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setServerStats(json.data);
        }
      }
    } catch {
      // server stats are optional/fallback
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    refreshStats();
    fetchServerStats();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleCacheUpdate = () => refreshStats();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('newage_cache_updated', handleCacheUpdate);

    const interval = setInterval(() => {
      refreshStats();
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('newage_cache_updated', handleCacheUpdate);
      clearInterval(interval);
    };
  }, [isOpen, refreshStats, fetchServerStats]);

  const { currentUser } = useAuth();
  if (!isOpen || currentUser?.role !== 'admin') return null;

  const handlePrefetch = async () => {
    setIsPrefetching(true);
    try {
      await api.cache.prefetchAll();
      refreshStats();
      showToast('⚡ Все ключевые разделы мгновенно предзагружены в кэш!');
    } catch (err) {
      showToast('⚠️ Ошибка при предзагрузке');
    } finally {
      setIsPrefetching(false);
    }
  };

  const handleClearClient = () => {
    api.cache.clear();
    refreshStats();
    showToast('🧹 Локальный кэш (RAM + LocalStorage) полностью очищен');
  };

  const handleInvalidateTag = (tag: string, name: string) => {
    api.cache.invalidate(tag);
    refreshStats();
    showToast(`🔄 Кэш раздела «${name}» сброшен`);
  };

  const handleClearServer = async () => {
    setIsClearingServer(true);
    try {
      const res = await fetch('/api/cache/clear', { method: 'POST' });
      if (res.ok) {
        await fetchServerStats();
        showToast('☁️ Кэш сервера и PostgreSQL успешно очищен');
      } else {
        showToast('⚠️ Ошибка очистки сервера');
      }
    } catch {
      showToast('⚠️ Сервер недоступен');
    } finally {
      setIsClearingServer(false);
    }
  };

  return (
    <div className="cache-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cache-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Toast Notification */}
        {toastMessage && (
          <div className="cache-toast-banner">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="cache-modal-header">
          <div className="cache-header-title-group">
            <div className="cache-header-icon-glow">
              <Database size={22} className="cache-header-icon" />
            </div>
            <div>
              <div className="cache-modal-title">
                Управление кэшированием данных
                <span className="cache-engine-badge">SWR v2 + RAM</span>
              </div>
              <div className="cache-modal-subtitle">
                Двухуровневая память: 0ms мгновенный отклик (L1) + автономность без сети (L2)
              </div>
            </div>
          </div>

          <div className="cache-header-actions">
            {isOnline ? (
              <span className="cache-status-pill online" title="Подключение активно">
                <Wifi size={13} />
                <span>Онлайн</span>
              </span>
            ) : (
              <span className="cache-status-pill offline" title="Работа из локального кэша">
                <WifiOff size={13} />
                <span>Офлайн-режим</span>
              </span>
            )}
            <button className="cache-close-btn" onClick={onClose} title="Закрыть">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="cache-modal-body">
          {/* Top Performance Cards */}
          <div className="cache-stats-grid">
            {/* Card 1: Hit Rate */}
            <div className="cache-stat-card highlight">
              <div className="stat-card-header">
                <div className="stat-card-icon-wrap hit-rate">
                  <Zap size={18} />
                </div>
                <span className="stat-card-title">Эффективность кэша</span>
              </div>
              <div className="stat-card-main-val">
                {stats.hitRatio}%
              </div>
              <div className="stat-progress-bar-bg">
                <div 
                  className="stat-progress-bar-fill" 
                  style={{ width: `${Math.max(5, Math.min(100, stats.hitRatio))}%` }} 
                />
              </div>
              <div className="stat-card-footer">
                {stats.hits} попаданий в кэш без задержек (0 ms)
              </div>
            </div>

            {/* Card 2: Hits vs Misses */}
            <div className="cache-stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon-wrap requests">
                  <RefreshCw size={18} />
                </div>
                <span className="stat-card-title">Запросы к данным</span>
              </div>
              <div className="stat-card-main-val">
                {stats.hits + stats.misses}
              </div>
              <div className="stat-two-col-metrics">
                <div>
                  <span className="metric-label">Попаданий:</span>
                  <span className="metric-val text-emerald">{stats.hits}</span>
                </div>
                <div>
                  <span className="metric-label">Сеть:</span>
                  <span className="metric-val text-amber">{stats.misses}</span>
                </div>
              </div>
              <div className="stat-card-footer">
                {stats.inFlight > 0 ? (
                  <span className="text-cyan">⚡ Дедупликация: {stats.inFlight} в полёте</span>
                ) : (
                  'Все запросы дедуплицированы'
                )}
              </div>
            </div>

            {/* Card 3: L1 In-Memory RAM */}
            <div className="cache-stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon-wrap memory">
                  <Cpu size={18} />
                </div>
                <span className="stat-card-title">L1 Оперативная память</span>
              </div>
              <div className="stat-card-main-val">
                {stats.estimatedMemoryFormatted}
              </div>
              <div className="stat-card-meta">
                {stats.memoryKeys} объектов в быстрой RAM
              </div>
              <div className="stat-card-footer">
                Мгновенное переключение экранов
              </div>
            </div>

            {/* Card 4: L2 LocalStorage */}
            <div className="cache-stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon-wrap storage">
                  <HardDrive size={18} />
                </div>
                <span className="stat-card-title">L2 Постоянный кэш</span>
              </div>
              <div className="stat-card-main-val">
                {stats.persistentKeys} разделов
              </div>
              <div className="stat-card-meta">
                Автономная база LocalStorage
              </div>
              <div className="stat-card-footer">
                Доступно даже без интернета
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="cache-actions-section">
            <div className="cache-section-title">
              <Sparkles size={16} />
              <span>Быстрые оптимизации</span>
            </div>
            <div className="cache-action-buttons-row">
              <button 
                className="cache-action-btn primary"
                onClick={handlePrefetch}
                disabled={isPrefetching}
              >
                <Zap size={16} className={isPrefetching ? 'spin-anim' : ''} />
                <span>{isPrefetching ? 'Предзагрузка...' : '⚡ Предзагрузить всё'}</span>
              </button>

              <button 
                className="cache-action-btn secondary"
                onClick={refreshStats}
              >
                <RefreshCw size={15} />
                <span>Обновить метрики</span>
              </button>

              <button 
                className="cache-action-btn danger"
                onClick={handleClearClient}
              >
                <Trash2 size={15} />
                <span>Очистить кэш клиента</span>
              </button>

              <button 
                className="cache-action-btn outline-warning"
                onClick={handleClearServer}
                disabled={isClearingServer}
              >
                <Server size={15} />
                <span>{isClearingServer ? 'Очистка...' : 'Сбросить кэш на сервере'}</span>
              </button>
            </div>
          </div>

          {/* Cache Categories Breakdown */}
          <div className="cache-categories-section">
            <div className="cache-section-title">
              <Layers size={16} />
              <span>Разделы в кэше (Tag Invalidation)</span>
            </div>
            <div className="cache-categories-grid">
              {CACHE_CATEGORIES.map((cat) => (
                <div key={cat.tag} className="cache-category-card">
                  <div className="category-card-left">
                    <span className="category-emoji">{cat.icon}</span>
                    <div className="category-card-text">
                      <div className="category-card-title">{cat.title}</div>
                      <div className="category-card-desc">{cat.desc}</div>
                    </div>
                  </div>
                  <div className="category-card-right">
                    <span className="category-tag-badge">#{cat.tag}</span>
                    <button 
                      className="category-reset-btn"
                      onClick={() => handleInvalidateTag(cat.tag, cat.title)}
                      title={`Сбросить кэш для раздела «${cat.title}»`}
                    >
                      <RefreshCw size={13} />
                      <span>Сброс</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Server Cache Overview (if available) */}
          {serverStats && (
            <div className="server-cache-card">
              <div className="server-cache-header">
                <div className="server-cache-title-group">
                  <Server size={16} className="text-cyan" />
                  <strong>Серверный кэш Go (RAM + PostgreSQL)</strong>
                </div>
                <span className="server-cache-tag">Серверная оптимизация</span>
              </div>
              <div className="server-cache-stats-row">
                <div className="server-metric-item">
                  <span className="lbl">Объектов на сервере:</span>
                  <span className="val">{serverStats.cached_items_count}</span>
                </div>
                <div className="server-metric-item">
                  <span className="lbl">Хит-рейт сервера:</span>
                  <span className="val text-emerald">{serverStats.hit_rate_percent}</span>
                </div>
                <div className="server-metric-item">
                  <span className="lbl">Серверные попадания:</span>
                  <span className="val">{serverStats.hits}</span>
                </div>
                <div className="server-metric-item">
                  <span className="lbl">Запросы в PostgreSQL:</span>
                  <span className="val text-amber">{serverStats.misses}</span>
                </div>
              </div>
            </div>
          )}

          {/* Architecture Explanation Banner */}
          <div className="cache-info-banner">
            <AlertCircle size={18} className="info-icon" />
            <div className="info-text">
              <strong>Как работает умный кэш New Age:</strong> При переходе между вкладками 
              данные мгновенно считываются из оперативной памяти за 0 мс (Stale-While-Revalidate). 
              В фоне приложение запрашивает свежие обновления, исключая задержки и белый экран. 
              При отсутствии интернета система автоматически переходит на сохранённую локальную копию.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
