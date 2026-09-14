import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bell, Sparkles, Wind, Heart, X, CheckCircle2 } from 'lucide-react';
import { spiritualAudio } from '../utils/spiritualAudio';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  category: 'affirmation' | 'breathing' | 'gratitude' | 'social' | 'system';
  timeStr: string;
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
  preferences: PushPreferences;
  updatePreferences: (partial: Partial<PushPreferences>) => void;
  toasts: ToastItem[];
  showToast: (title: string, message: string, category: ToastItem['category']) => void;
  removeToast: (id: string) => void;
  triggerTestPush: (category?: ToastItem['category']) => void;
  requestDesktopPermission: () => Promise<boolean>;
  browserPermission: NotificationPermission | 'unsupported';
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<PushPreferences>(() => {
    const saved = localStorage.getItem('newage_push_prefs');
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

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>('default');

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
    localStorage.setItem('newage_push_prefs', JSON.stringify(updated));
  };

  const showToast = (title: string, message: string, category: ToastItem['category']) => {
    spiritualAudio.playCrystalChime();

    const newToast: ToastItem = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      category,
      timeStr: 'Только что'
    };

    setToasts(prev => [newToast, ...prev.slice(0, 3)]); // Keep max 4 toasts

    // Also fire native browser notification if granted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      } catch {
        // Ignore fallback
      }
    }

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      removeToast(newToast.id);
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const requestDesktopPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    try {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        showToast('Уведомления включены', 'Вы будете получать напоминания о практиках и сообщениях.', 'system');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const triggerTestPush = (category: ToastItem['category'] = 'affirmation') => {
    if (category === 'affirmation') {
      showToast(
        '🌅 Утренняя аффирмация New Age',
        '«Мой ум чист, сердце открыто, а день наполнен благополучием и созиданием.»',
        'affirmation'
      );
    } else if (category === 'breathing') {
      showToast(
        '🌬️ Время перезагрузки (Дыхание 4-7-8)',
        'Сделайте 2-минутную паузу на осознанное дыхание для снятия напряжения.',
        'breathing'
      );
    } else if (category === 'gratitude') {
      showToast(
        '🌙 Вечерний дневник благодарности',
        'Вспомните и запишите 3 приятных момента уходящего дня перед сном.',
        'gratitude'
      );
    } else {
      showToast(
        '💬 Новое сообщение в New Age',
        'Мастер Ананта ответил на ваш вопрос по курсу Аштанга-йоги.',
        'social'
      );
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        updatePreferences,
        toasts,
        showToast,
        removeToast,
        triggerTestPush,
        requestDesktopPermission,
        browserPermission
      }}
    >
      {children}

      {/* Floating In-App Toast Stack */}
      <div className="toast-portal-container">
        {toasts.map(t => (
          <div key={t.id} className={`push-toast-card toast-cat-${t.category}`}>
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
              onClick={() => removeToast(t.id)}
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
