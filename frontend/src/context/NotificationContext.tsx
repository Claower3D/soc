import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Sparkles, Wind, Heart, X, CheckCircle2 } from 'lucide-react';
import { spiritualAudio } from '../utils/spiritualAudio';
import { api } from '../api';

export interface AppNotification {
  id: string;
  userId?: string;
  actorId?: string;
  actor?: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  type: 'like' | 'comment' | 'follow' | 'friend_request' | 'message' | 'call' | 'spiritual' | 'system';
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  category: 'affirmation' | 'breathing' | 'gratitude' | 'social' | 'system';
  timeStr: string;
  link?: string;
}

export interface PushPreferences {
  morningAffirmation: boolean;
  morningTime: string;
  afternoonBreathing: boolean;
  afternoonTime: string;
  eveningGratitude: boolean;
  eveningTime: string;
  socialAlerts: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  preferences: PushPreferences;
  updatePreferences: (partial: Partial<PushPreferences>) => void;
  toasts: ToastItem[];
  showToast: (title: string, message: string, category: ToastItem['category'], link?: string) => void;
  removeToast: (id: string) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id?: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  triggerTestPush: (category?: ToastItem['category']) => void;
  requestDesktopPermission: () => Promise<boolean>;
  browserPermission: NotificationPermission | 'unsupported';
}

const STORAGE_KEY_NOTIFS = 'newage_real_notifications_list';
const STORAGE_KEY_PREFS = 'newage_push_prefs';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<PushPreferences>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFS);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {
      morningAffirmation: true,
      morningTime: '09:00',
      afternoonBreathing: true,
      afternoonTime: '14:00',
      eveningGratitude: true,
      eveningTime: '21:30',
      socialAlerts: true
    };
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    // Default initial welcome notifications
    return [
      {
        id: 'notif_welcome_1',
        type: 'spiritual',
        title: '✨ Добро пожаловать в New Age',
        body: 'Экосистема духовного развития, творчества и живого общения настроена и готова к работе.',
        link: '/spiritual',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_welcome_2',
        type: 'system',
        title: '🔔 Центр уведомлений активен',
        body: 'Здесь будут появляться ответы собеседников, реакции, новые подписчики и напоминания о практиках.',
        link: '/',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];
  });

  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch { /* ignore */ }
  }, [notifications]);

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    } else {
      setBrowserPermission('unsupported');
    }
  }, []);

  const updatePreferences = (partial: Partial<PushPreferences>) => {
    const updated = { ...preferences, ...partial };
    setPreferences(updated);
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
  };

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((title: string, message: string, category: ToastItem['category'], link?: string) => {
    spiritualAudio.playCrystalChime();

    const newToast: ToastItem = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      category,
      timeStr: 'Только что',
      link
    };

    setToasts(prev => [newToast, ...prev.slice(0, 3)]); // Keep max 4 toasts

    // Native browser push notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      } catch { /* fallback */ }
    }

    setTimeout(() => {
      removeToast(newToast.id);
    }, 6000);
  }, [removeToast]);

  const addNotification = useCallback((notifData: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    setNotifications(prev => [newNotif, ...prev.slice(0, 99)]);

    let cat: ToastItem['category'] = 'system';
    if (newNotif.type === 'spiritual') cat = 'affirmation';
    else if (newNotif.type === 'message' || newNotif.type === 'like' || newNotif.type === 'follow') cat = 'social';

    showToast(newNotif.title, newNotif.body, cat, newNotif.link);
  }, [showToast]);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    const isAuth = localStorage.getItem('new_age_is_auth') === 'true';
    const token = localStorage.getItem('new_age_jwt_token');
    if (!token || !isAuth) return;

    setLoading(true);
    try {
      const data = await api.notifications.list();
      if (data && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch {
      // Offline fallback: keep local notifications
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll server notifications periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    }, 30000); // every 30 seconds
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark as read
  const markAsRead = async (id?: string) => {
    setNotifications(prev =>
      prev.map(n => (!id || n.id === id ? { ...n, isRead: true } : n))
    );
    try {
      await api.notifications.markRead(id);
    } catch { /* ignore offline */ }
  };

  // Delete single notification
  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.notifications.delete(id);
    } catch { /* ignore offline */ }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      await api.notifications.clearAll();
    } catch { /* ignore offline */ }
  };

  // Request browser permission
  const requestDesktopPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    try {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        showToast('Уведомления включены', 'Вы будете получать напоминания о практиках и событиях.', 'system');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Trigger test push
  const triggerTestPush = async (category: ToastItem['category'] = 'affirmation') => {
    let type = 'affirmation';
    if (category === 'breathing') type = 'breathing';
    else if (category === 'gratitude') type = 'gratitude';
    else if (category === 'social') type = 'social';
    else if (category === 'system') type = 'system';

    try {
      const token = localStorage.getItem('new_age_jwt_token');
      if (token) {
        const res = await api.notifications.sendTest(type);
        if (res && res.id) {
          setNotifications(prev => [res, ...prev]);
          let cat: ToastItem['category'] = 'system';
          if (res.type === 'spiritual') cat = 'affirmation';
          else if (res.type === 'message' || res.type === 'like' || res.type === 'follow') cat = 'social';
          showToast(res.title, res.body, cat, res.link);
          return;
        }
      }
    } catch { /* local fallback */ }

    if (category === 'affirmation') {
      addNotification({
        type: 'spiritual',
        title: '🌅 Утренняя аффирмация New Age',
        body: '«Мой ум чист, сердце открыто, а день наполнен благополучием и созиданием.»',
        link: '/spiritual'
      });
    } else if (category === 'breathing') {
      addNotification({
        type: 'spiritual',
        title: '🌬️ Время перезагрузки (Дыхание 4-7-8)',
        body: 'Сделайте 2-минутную паузу на осознанное дыхание для снятия напряжения.',
        link: '/spiritual'
      });
    } else if (category === 'gratitude') {
      addNotification({
        type: 'spiritual',
        title: '🌙 Вечерний дневник благодарности',
        body: 'Вспомните и запишите 3 приятных момента уходящего дня перед сном.',
        link: '/spiritual'
      });
    } else {
      addNotification({
        type: 'message',
        title: '💬 Новое сообщение в New Age',
        body: 'Нейросетевой помощник отправил вам ответ на вопрос по практикам.',
        link: '/messenger?chat=chat_ai_oracle'
      });
    }
  };

  // Global event listener for custom app notifications
  useEffect(() => {
    const handleCustomNotification = (e: any) => {
      const notif = e.detail;
      if (notif && notif.title) {
        addNotification(notif);
      }
    };
    window.addEventListener('app_notification', handleCustomNotification);
    return () => window.removeEventListener('app_notification', handleCustomNotification);
  }, [addNotification]);

  // Scheduled practice reminder timer
  const lastTriggeredMinute = useRef<string>('');
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (lastTriggeredMinute.current === timeStr) return;

      if (preferences.morningAffirmation && timeStr === preferences.morningTime) {
        lastTriggeredMinute.current = timeStr;
        triggerTestPush('affirmation');
      } else if (preferences.afternoonBreathing && timeStr === preferences.afternoonTime) {
        lastTriggeredMinute.current = timeStr;
        triggerTestPush('breathing');
      } else if (preferences.eveningGratitude && timeStr === preferences.eveningTime) {
        lastTriggeredMinute.current = timeStr;
        triggerTestPush('gratitude');
      }
    };

    const timer = setInterval(checkSchedule, 15000);
    return () => clearInterval(timer);
  }, [preferences]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        preferences,
        updatePreferences,
        toasts,
        showToast,
        removeToast,
        fetchNotifications,
        markAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
        triggerTestPush,
        requestDesktopPermission,
        browserPermission
      }}
    >
      {children}

      {/* Floating In-App Toast Stack */}
      <div className="toast-portal-container">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`push-toast-card toast-cat-${t.category}`}
            onClick={() => {
              if (t.link) {
                window.location.href = t.link;
              }
            }}
            style={{ cursor: t.link ? 'pointer' : 'default' }}
          >
            <div className="toast-icon-wrap">
              {t.category === 'affirmation' && <Sparkles size={18} className="toast-icon-sparkle" />}
              {t.category === 'breathing' && <Wind size={18} className="toast-icon-wind" />}
              {t.category === 'gratitude' && <Heart size={18} className="toast-icon-heart" />}
              {t.category === 'social' && <Bell size={18} className="toast-icon-bell" />}
              {t.category === 'system' && <CheckCircle2 size={18} className="toast-icon-check" />}
            </div>

            <div className="toast-content-body">
              <div className="toast-title-row">
                <span className="toast-title-text">{t.title}</span>
                <span className="toast-time-sub">{t.timeStr}</span>
              </div>
              <p className="toast-message-text">{t.message}</p>
            </div>

            <button 
              className="toast-close-btn" 
              onClick={(e) => {
                e.stopPropagation();
                removeToast(t.id);
              }}
              title="Закрыть"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
