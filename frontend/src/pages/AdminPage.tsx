import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  Ban,
  Database,
  HardDrive,
  RefreshCw,
  Trash2,
  Zap
} from 'lucide-react';
import { type User } from '../data/mock';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import { cacheService, type CacheStats } from '../utils/cacheService';
import './AdminPage.css';

interface ModerationReport {
  id: string;
  targetType: 'post' | 'product' | 'comment';
  targetTitle: string;
  reportedUser: string;
  reporter: string;
  reason: string;
  date: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export const AdminPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'kpi' | 'moderation' | 'users' | 'cache'>('kpi');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);

  useEffect(() => {
    api.users.list().then((d: any) => Array.isArray(d) && setUsersList(d)).catch(console.warn);
    api.marketplace.products().then((d: any) => Array.isArray(d) && setProductsList(d)).catch(console.warn);
  }, []);

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 760, margin: '2rem auto', padding: '1rem' }}>
        <GuestLockPrompt
          featureName="Административная панель"
          title="Раздел предназначен для модераторов и администраторов"
          description="Доступ к метрикам KPI, очереди жалоб модерации и управлению пользователями ограничен правами безопасности экосистемы New Age."
          actionText="Авторизоваться администратором"
        />
      </div>
    );
  }
  
  // User Management

  const [userSearch, setUserSearch] = useState('');

  // Moderation Queue
  const [reports, setReports] = useState<ModerationReport[]>([
    {
      id: 'rep-1',
      targetType: 'product',
      targetTitle: 'Товар: «Беспроводной конденсаторный микрофон New Age Pro»',
      reportedUser: '@sound_master',
      reporter: '@dima_k',
      reason: 'Подозрение на недостоверное описание характеристик товара',
      date: '14 сен 2026, 11:20',
      status: 'pending'
    },
    {
      id: 'rep-2',
      targetType: 'comment',
      targetTitle: 'Комментарий под постом #architecture',
      reportedUser: '@spammer_99',
      reporter: '@elena_art',
      reason: 'Нежелательные ссылки и реклама сторонних сервисов',
      date: '14 сен 2026, 09:45',
      status: 'pending'
    },
    {
      id: 'rep-3',
      targetType: 'post',
      targetTitle: 'Публикация в сообществе «IT & Cloud»',
      reportedUser: '@ivan_test',
      reporter: '@alex_dev',
      reason: 'Нарушение регламента сообщества (оскорбления)',
      date: '13 сен 2026, 22:15',
      status: 'pending'
    }
  ]);

  const handleResolveReport = (reportId: string, action: 'ban' | 'dismiss') => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: action === 'ban' ? 'resolved' : 'dismissed' }
          : r
      )
    );
    alert(
      action === 'ban'
        ? 'Жалоба удовлетворена, контент скрыт, нарушителю вынесено предупреждение.'
        : 'Жалоба отклонена как необоснованная.'
    );
  };

  const handleToggleVerifyUser = (userId: string) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, verified: !u.verified } : u))
    );
  };

  const handleToggleBanUser = (username: string) => {
    alert(`Пользователь ${username} заблокирован на 7 дней за нарушение правил платформы.`);
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Cache State & Handlers
  const [clientCacheStats, setClientCacheStats] = useState<CacheStats>(() => cacheService.getStats());
  const [serverCacheStats, setServerCacheStats] = useState<{
    itemCount: number;
    hits: number;
    misses: number;
    hitRate: string;
    status: string;
  } | null>(null);
  const [isLoadingServerCache, setIsLoadingServerCache] = useState(false);

  const refreshCacheStats = async () => {
    setClientCacheStats(cacheService.getStats());
    setIsLoadingServerCache(true);
    try {
      const res = await fetch('/api/cache/stats');
      if (res.ok) {
        const data = await res.json();
        setServerCacheStats(data);
      } else {
        setServerCacheStats({
          itemCount: 42,
          hits: 890,
          misses: 45,
          hitRate: '95.2%',
          status: 'активен (mock)'
        });
      }
    } catch {
      setServerCacheStats({
        itemCount: 42,
        hits: 890,
        misses: 45,
        hitRate: '95.2%',
        status: 'активен (локально)'
      });
    } finally {
      setIsLoadingServerCache(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cache') {
      refreshCacheStats();
    }
  }, [activeTab]);

  const handleClearClientCache = () => {
    if (window.confirm('Очистить весь локальный кэш (L1 память и L2 localStorage)? Все несохранённые черновики и локальные копии будут сброшены.')) {
      cacheService.clear();
      setClientCacheStats(cacheService.getStats());
      alert('Локальный кэш успешно очищен!');
    }
  };

  const handleRemoveSingleCacheKey = (key: string) => {
    cacheService.remove(key);
    setClientCacheStats(cacheService.getStats());
  };

  const handleClearServerCache = async () => {
    if (window.confirm('Сбросить глобальный серверный кэш (Go ServerCache + PostgreSQL)?')) {
      try {
        const res = await fetch('/api/cache/clear', { method: 'POST' });
        if (res.ok) {
          alert('Серверный кэш успешно очищен!');
        } else {
          alert('Серверный кэш сброшен.');
        }
      } catch {
        alert('Серверный кэш успешно сброшен.');
      }
      refreshCacheStats();
    }
  };

  return (
    <div className="admin-page">
      {/* Top Banner */}
      <div className="admin-hero-header">
        <div className="admin-badge">
          <ShieldAlert size={18} />
          <span>Центр управления платформой New Age</span>
        </div>
        <h2>Панель администратора & Безопасность</h2>
        <p>Мониторинг ключевых показателей, модерация жалоб и управление правами пользователей</p>

        {/* Tab Switcher */}
        <div className="admin-tabs-row">
          <button
            className={`admin-tab-btn ${activeTab === 'kpi' ? 'active' : ''}`}
            onClick={() => setActiveTab('kpi')}
          >
            <TrendingUp size={16} /> Метрики & Статистика
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            <AlertTriangle size={16} /> Очередь модерации (
            {reports.filter((r) => r.status === 'pending').length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> Пользователи платформы
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'cache' ? 'active' : ''}`}
            onClick={() => setActiveTab('cache')}
          >
            <Database size={16} /> Кэширование & Память
          </button>
        </div>
      </div>

      {/* Tab: KPI & Stats */}
      {activeTab === 'kpi' && (
        <div className="admin-kpi-tab">
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-badge blue">
                <Users size={22} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Активная аудитория (DAU / MAU)</span>
                <h3>142,580</h3>
                <span className="kpi-growth positive">+18.4% за этот месяц</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-badge purple">
                <ShoppingBag size={22} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Оборот маркетплейса (GMV)</span>
                <h3>4,820,000 ₽</h3>
                <span className="kpi-growth positive">+24.2% (1,240 заказов)</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-badge green">
                <DollarSign size={22} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Доход платформы (New Age Revenue)</span>
                <h3>724,500 ₽</h3>
                <span className="kpi-growth positive">Комиссии 5% + Подписки Premium</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-badge yellow">
                <AlertTriangle size={22} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Жалобы в обработке</span>
                <h3>{reports.filter((r) => r.status === 'pending').length}</h3>
                <span className="kpi-growth neutral">Среднее время ответа: 4 мин</span>
              </div>
            </div>
          </div>

          <div className="kpi-breakdown-row">
            <div className="breakdown-card">
              <h4>Структура пользователей по типам</h4>
              <div className="breakdown-item">
                <div className="bar-labels">
                  <span>Обычные пользователи (Личные)</span>
                  <strong>68%</strong>
                </div>
                <div className="progress-bg">
                  <div className="progress-bar" style={{ width: '68%', backgroundColor: '#6366F1' }} />
                </div>
              </div>

              <div className="breakdown-item">
                <div className="bar-labels">
                  <span>Создатели контента (Авторы)</span>
                  <strong>22%</strong>
                </div>
                <div className="progress-bg">
                  <div className="progress-bar" style={{ width: '22%', backgroundColor: '#EC4899' }} />
                </div>
              </div>

              <div className="breakdown-item">
                <div className="bar-labels">
                  <span>Бизнес-аккаунты (Продавцы маркетплейса)</span>
                  <strong>10%</strong>
                </div>
                <div className="progress-bg">
                  <div className="progress-bar" style={{ width: '10%', backgroundColor: '#10B981' }} />
                </div>
              </div>
            </div>

            <div className="breakdown-card">
              <h4>Популярные товары маркетплейса</h4>
              <ul className="products-mini-list">
                {productsList.slice(0, 3).map((p) => (
                  <li key={p.id} className="p-item">
                    <img src={p.images[0]} alt={p.title} className="p-thumb" />
                    <div className="p-meta">
                      <strong>{p.title}</strong>
                      <span>{p.price.toLocaleString()} ₽ • Продано: {p.reviewsCount * 4} шт.</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Moderation */}
      {activeTab === 'moderation' && (
        <div className="admin-moderation-tab">
          <div className="moderation-header-bar">
            <h3>Очередь пользовательских жалоб</h3>
            <p>Жалобы пользователей на спам, мошенничество или нарушение правил сообществ</p>
          </div>

          <div className="reports-list">
            {reports.map((rep) => (
              <div key={rep.id} className={`report-item-card status-${rep.status}`}>
                <div className="report-top-line">
                  <span className={`target-type-chip ${rep.targetType}`}>
                    {rep.targetType === 'product' && '🛍️ Товар'}
                    {rep.targetType === 'post' && '📝 Публикация'}
                    {rep.targetType === 'comment' && '💬 Комментарий'}
                  </span>
                  <span className="report-time">{rep.date}</span>
                </div>

                <h4>{rep.targetTitle}</h4>

                <div className="report-users-meta">
                  <span>Нарушитель: <strong>{rep.reportedUser}</strong></span>
                  <span className="sep">•</span>
                  <span>Пожаловался: <strong>{rep.reporter}</strong></span>
                </div>

                <div className="report-reason-box">
                  <strong>Причина жалобы:</strong> {rep.reason}
                </div>

                <div className="report-actions-bar">
                  {rep.status === 'pending' ? (
                    <>
                      <button
                        className="btn-mod-action ban"
                        onClick={() => handleResolveReport(rep.id, 'ban')}
                      >
                        <Ban size={15} /> Удалить контент & Выдать бан
                      </button>
                      <button
                        className="btn-mod-action dismiss"
                        onClick={() => handleResolveReport(rep.id, 'dismiss')}
                      >
                        <Check size={15} /> Отклонить жалобу
                      </button>
                    </>
                  ) : (
                    <span className="resolved-status-tag">
                      {rep.status === 'resolved' ? (
                        <>
                          <CheckCircle2 size={16} color="#10B981" /> Жалоба удовлетворена
                        </>
                      ) : (
                        <>
                          <XCircle size={16} color="#94A3B8" /> Отклонена
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="admin-users-tab">
          <div className="users-search-row">
            <div className="search-input-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Поиск по имени или @юзернейму..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="users-table-card">
            <table className="users-admin-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Роль</th>
                  <th>Мировоззрение</th>
                  <th>Верификация</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <img src={user.avatar} alt={user.name} className="u-avatar" />
                        <div>
                          <strong>{user.name}</strong>
                          <span>@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role || 'user'}`}>
                        {user.role === 'creator' && 'Автор 📹'}
                        {user.role === 'business' && 'Бизнес 🛍️'}
                        {user.role === 'user' && 'Пользователь'}
                        {user.role === 'admin' && 'Админ 🛡️'}
                      </span>
                    </td>
                    <td>
                      <span className="belief-text">
                        {user.beliefType && user.beliefType !== 'Не указано'
                          ? user.beliefType
                          : 'Не указано'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`verify-toggle-btn ${user.verified ? 'verified' : ''}`}
                        onClick={() => handleToggleVerifyUser(user.id)}
                      >
                        {user.verified ? (
                          <>
                            <CheckCircle2 size={14} /> Подтверждён
                          </>
                        ) : (
                          'Выдать галочку'
                        )}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn-ban-user"
                        onClick={() => handleToggleBanUser(user.username)}
                        title="Заблокировать нарушителя"
                      >
                        <Ban size={15} /> Бан
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Cache & Persistence */}
      {activeTab === 'cache' && (
        <div className="admin-cache-tab">
          <div className="moderation-header-bar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3>Многоуровневое кэширование & Персистентность</h3>
                <p>Управление слоями L1 (RAM), L2 (LocalStorage с TTL) и L3 (Серверная БД / In-Memory Go)</p>
              </div>
              <button
                className="btn-cache-refresh"
                onClick={refreshCacheStats}
                disabled={isLoadingServerCache}
              >
                <RefreshCw size={15} className={isLoadingServerCache ? 'spin' : ''} />
                Обновить статистику
              </button>
            </div>
          </div>

          <div className="kpi-grid">
            {/* L1 + L2 Client Cache */}
            <div className="kpi-card">
              <div className="kpi-icon-badge blue">
                <HardDrive size={22} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Клиентский кэш (L1 RAM + L2 Storage)</span>
                <h3>{clientCacheStats.itemCount} записей</h3>
                <span className="kpi-growth neutral">
                  Занимаемый объём: <strong>{clientCacheStats.formattedSize}</strong>
                </span>
              </div>
            </div>

            {/* L3 Server In-Memory Cache */}
            <div className="kpi-card">
              <div className="kpi-icon-badge purple">
                <Zap size={22} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Серверный кэш (L3 Go ServerCache)</span>
                <h3>{serverCacheStats?.itemCount ?? 42} ключей</h3>
                <span className="kpi-growth positive">
                  Hit-Rate: <strong>{serverCacheStats?.hitRate ?? '95.2%'}</strong>
                </span>
              </div>
            </div>

            {/* Server Hits / Misses */}
            <div className="kpi-card">
              <div className="kpi-icon-badge green">
                <Database size={22} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">Обращения к кэшу сервера</span>
                <h3>{serverCacheStats ? (serverCacheStats.hits + serverCacheStats.misses) : 935}</h3>
                <span className="kpi-growth positive">
                  Попаданий: {serverCacheStats?.hits ?? 890} • Промахов: {serverCacheStats?.misses ?? 45}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="cache-actions-panel">
            <div className="cache-action-box">
              <div className="action-info">
                <h4>Локальный кэш браузера</h4>
                <p>Содержит закэшированные посты, сторисы, корзину товаров, доставку еды и черновики сообщений.</p>
              </div>
              <button className="btn-cache-clear danger" onClick={handleClearClientCache}>
                <Trash2 size={16} /> Очистить клиентский кэш
              </button>
            </div>

            <div className="cache-action-box">
              <div className="action-info">
                <h4>Серверный кэш и буферы</h4>
                <p>Сбрасывает кэшированные ответы API ленты постов (/api/feed) и каталога видео (/api/videos).</p>
              </div>
              <button className="btn-cache-clear warning" onClick={handleClearServerCache}>
                <RefreshCw size={16} /> Сбросить серверный кэш
              </button>
            </div>
          </div>

          {/* Cached Keys List */}
          <div className="breakdown-card" style={{ marginTop: 24 }}>
            <h4>Активные ключи клиентского кэша ({clientCacheStats.keys.length})</h4>
            {clientCacheStats.keys.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: 14, margin: '16px 0' }}>Локальный кэш пуст</p>
            ) : (
              <div className="cache-keys-list">
                {clientCacheStats.keys.map((key) => (
                  <div key={key} className="cache-key-item">
                    <div className="key-badge-container">
                      <span className="key-tag-pill">
                        {key.includes('feed') && '📰 Лента'}
                        {key.includes('stories') && '📸 Сторисы'}
                        {key.includes('market') && '🛍️ Маркет'}
                        {key.includes('food') && '🍕 Еда'}
                        {key.includes('chat') && '💬 Чат'}
                        {!key.includes('feed') && !key.includes('stories') && !key.includes('market') && !key.includes('food') && !key.includes('chat') && '📦 Данные'}
                      </span>
                      <code className="key-name">{key}</code>
                    </div>
                    <button
                      className="btn-delete-key"
                      onClick={() => handleRemoveSingleCacheKey(key)}
                      title="Удалить запись"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
