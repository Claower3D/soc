import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, Headphones,
  Bell, Check, Plus, Image as ImageIcon, PhoneCall, ShoppingBag, 
  Users, Film, LogIn, Sparkles, Wind, Heart, BellRing,
  MessageCircle, UserPlus, Trash2, X, Settings, Search, QrCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTranslation } from '../context/LanguageContext';
import { AuthModal } from './AuthModal';
import { EditProfileModal, type EditTab } from './EditProfileModal';
import { QrScannerModal } from './QrScannerModal';
import { PremiumBadge } from './PremiumBadge';
import { getAvatarUrl, handleAvatarError } from '../utils/avatar';
import './Header.css';

export function Header() {
  const { currentUser, isAuthenticated, openAuthModal, updateProfile, logout } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    deleteNotification, 
    clearAllNotifications, 
    preferences, 
    updatePreferences, 
    triggerTestPush, 
    requestDesktopPermission, 
    browserPermission 
  } = useNotifications();
  const { t } = useTranslation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'alerts' | 'push_settings'>('alerts');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<EditTab>('preferences');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpenSettings = (e: any) => {
      setSettingsInitialTab(e.detail?.tab || 'preferences');
      setIsSettingsOpen(true);
    };
    const handleOpenQr = () => setIsQrScannerOpen(true);
    window.addEventListener('open-profile-settings', handleOpenSettings);
    window.addEventListener('open-qr-scanner', handleOpenQr);
    return () => {
      window.removeEventListener('open-profile-settings', handleOpenSettings);
      window.removeEventListener('open-qr-scanner', handleOpenQr);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (createRef.current && !createRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <header className="global-header">
      {/* Left / Spacer area for clean header alignment */}
      <div className="header-left-area" />

      <div className="header-actions">
        {/* Create Content Dropdown */}
        <div className="header-create-wrapper" ref={createRef}>
          <button
            className={`header-action-btn create-main-btn ${createMenuOpen ? 'active' : ''}`}
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
            title="Создать контент"
          >
            <Plus size={18} />
            <span className="btn-text">Создать</span>
          </button>

          {createMenuOpen && (
            <div className="header-create-dropdown">
              <button 
                className="create-menu-item" 
                onClick={() => { 
                  setCreateMenuOpen(false); 
                  if (!isAuthenticated) {
                    openAuthModal('register');
                  } else {
                    navigate('/'); 
                  }
                }}
              >
                <ImageIcon size={18} color="#10B981" />
                <div className="create-item-text">
                  <strong>Публикация / Новость</strong>
                  <span>Поделиться фото или мыслями в ленте</span>
                </div>
              </button>

              <button 
                className="create-menu-item" 
                onClick={() => { 
                  setCreateMenuOpen(false); 
                  if (!isAuthenticated) {
                    openAuthModal('register');
                  } else {
                    navigate('/video'); 
                  }
                }}
              >
                <Video size={18} color="#EF4444" />
                <div className="create-item-text">
                  <strong>Загрузить видео</strong>
                  <span>Опубликовать видеоролик на канал</span>
                </div>
              </button>

              <button 
                className="create-menu-item" 
                onClick={() => { 
                  setCreateMenuOpen(false); 
                  if (!isAuthenticated) {
                    openAuthModal('register');
                  } else {
                    navigate('/podcasts'); 
                  }
                }}
              >
                <Headphones size={18} color="var(--color-accent)" />
                <div className="create-item-text">
                  <strong>Опубликовать подкаст</strong>
                  <span>Новый аудио-выпуск или шоу</span>
                </div>
              </button>

              <button 
                className="create-menu-item" 
                onClick={() => { 
                  setCreateMenuOpen(false); 
                  if (!isAuthenticated) {
                    openAuthModal('register');
                  } else {
                    navigate('/conferences'); 
                  }
                }}
              >
                <PhoneCall size={18} color="#3B82F6" />
                <div className="create-item-text">
                  <strong>Конференция</strong>
                  <span>Создать открытую или закрытую встречу</span>
                </div>
              </button>

              <button 
                className="create-menu-item" 
                onClick={() => { 
                  setCreateMenuOpen(false); 
                  if (!isAuthenticated) {
                    openAuthModal('register');
                  } else {
                    navigate('/marketplace'); 
                  }
                }}
              >
                <ShoppingBag size={18} color="#10B981" />
                <div className="create-item-text">
                  <strong>Товар на Маркетплейс</strong>
                  <span>Разместить товар в каталоге и витрине</span>
                </div>
              </button>

              <button 
                className="create-menu-item" 
                onClick={() => { 
                  setCreateMenuOpen(false); 
                  if (!isAuthenticated) {
                    openAuthModal('register');
                  } else {
                    navigate('/communities'); 
                  }
                }}
              >
                <Users size={18} color="#8B5CF6" />
                <div className="create-item-text">
                  <strong>Создать Сообщество</strong>
                  <span>Клуб по интересам, профессии или мировоззрению</span>
                </div>
              </button>

              <button 
                className="create-menu-item" 
                onClick={() => { 
                  setCreateMenuOpen(false); 
                  if (!isAuthenticated) {
                    openAuthModal('register');
                  } else {
                    navigate('/editor'); 
                  }
                }}
              >
                <Film size={18} color="#F59E0B" />
                <div className="create-item-text">
                  <strong>Видеостудия</strong>
                  <span>Смонтировать ролик, сторис или shorts</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Sleek AI Oracle Trigger */}
        <button
          className="header-action-btn ai-oracle-pill"
          onClick={() => navigate('/messenger?chat=chat_ai_oracle')}
          title="Спросить ИИ-Оракула (Говорит на всех языках мира)"
        >
          <Sparkles size={14} className="ai-oracle-icon" />
          <span className="ai-oracle-text">Оракул</span>
          <span className="ai-oracle-dot" title="Онлайн" />
        </button>

        {/* Search Shortcut */}
        <button
          className="header-action-btn header-search-btn"
          onClick={() => navigate('/search')}
          title="Поиск людей, публикаций, музыки"
        >
          <Search size={15} />
        </button>



        <div className="header-divider" />

        {/* Auth / Profile Area */}
        {isAuthenticated ? (
          <>
            <div className="notification-wrapper" ref={notifRef}>
              <button
                className={`header-icon-btn ${notificationsOpen ? 'active' : ''}`}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Уведомления и Push-напоминания"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div 
                    className="notifications-mobile-backdrop" 
                    onClick={() => setNotificationsOpen(false)} 
                    aria-hidden="true" 
                  />
                  <div className="notifications-popover">
                  <div className="notifications-header">
                    <div className="notif-popover-tabs">
                      <button 
                        className={`notif-tab-btn ${notifTab === 'alerts' ? 'active' : ''}`}
                        onClick={() => setNotifTab('alerts')}
                      >
                        События {unreadCount > 0 && <span className="notif-tab-count-badge">{unreadCount}</span>}
                      </button>
                      <button 
                        className={`notif-tab-btn ${notifTab === 'push_settings' ? 'active' : ''}`}
                        onClick={() => setNotifTab('push_settings')}
                      >
                        Push-напоминания
                      </button>
                    </div>
                    {notifTab === 'alerts' && unreadCount > 0 && (
                      <button 
                        className="notifications-mark-read-btn" 
                        onClick={() => markAsRead()}
                        title="Пометить все как прочитанные"
                      >
                        <Check size={13} />
                        <span>Прочитано</span>
                      </button>
                    )}
                  </div>

                  {notifTab === 'alerts' ? (
                    <div className="notifications-list-container">
                      {notifications.length === 0 ? (
                        <div className="notifications-empty-state">
                          <div className="empty-bell-circle">
                            <Bell size={24} />
                          </div>
                          <p className="empty-title">Уведомлений пока нет</p>
                          <span className="empty-subtitle">Лайки, комментарии, подписки и сообщения появятся здесь</span>
                        </div>
                      ) : (
                        <>
                          <div className="notifications-scrollable-list">
                            {notifications.map((notif) => {
                              const getNotifIcon = () => {
                                switch (notif.type) {
                                  case 'like': return <Heart size={12} className="notif-type-icon like" />;
                                  case 'comment':
                                  case 'message': return <MessageCircle size={12} className="notif-type-icon message" />;
                                  case 'follow':
                                  case 'friend_request': return <UserPlus size={12} className="notif-type-icon follow" />;
                                  case 'spiritual': return <Sparkles size={12} className="notif-type-icon spiritual" />;
                                  case 'call': return <PhoneCall size={12} className="notif-type-icon call" />;
                                  default: return <Bell size={12} className="notif-type-icon default" />;
                                }
                              };

                              const formatTime = (ts: string) => {
                                if (!ts) return '';
                                try {
                                  const date = new Date(ts);
                                  const now = new Date();
                                  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
                                  if (diffSec < 60) return 'только что';
                                  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин`;
                                  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ч`;
                                  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
                                } catch {
                                  return '';
                                }
                              };

                              return (
                                <div 
                                  key={notif.id} 
                                  className={`notif-card-item ${!notif.isRead ? 'unread' : ''}`}
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    if (notif.link) {
                                      navigate(notif.link);
                                      setNotificationsOpen(false);
                                    }
                                  }}
                                >
                                  <div className="notif-card-avatar-box">
                                    {notif.actor?.avatar ? (
                                      <img 
                                        src={getAvatarUrl(notif.actor)} 
                                        alt="" 
                                        className="notif-card-avatar"
                                        onError={handleAvatarError} 
                                      />
                                    ) : (
                                      <div className="notif-card-avatar-fallback">
                                        {getNotifIcon()}
                                      </div>
                                    )}
                                    {notif.actor?.avatar && (
                                      <span className="notif-card-badge-badge">
                                        {getNotifIcon()}
                                      </span>
                                    )}
                                  </div>

                                  <div className="notif-card-text">
                                    <div className="notif-card-title-row">
                                      <span className="notif-card-title">{notif.title}</span>
                                      <span className="notif-card-time">{formatTime(notif.createdAt)}</span>
                                    </div>
                                    <p className="notif-card-body">{notif.body}</p>
                                  </div>

                                  <div className="notif-card-actions" onClick={e => e.stopPropagation()}>
                                    {!notif.isRead && <span className="notif-unread-glow" title="Не прочитано" />}
                                    <button 
                                      className="notif-dismiss-btn" 
                                      title="Удалить"
                                      onClick={() => deleteNotification(notif.id)}
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="notifications-footer-bar">
                            <button 
                              className="notif-clear-btn"
                              onClick={() => clearAllNotifications()}
                            >
                              <Trash2 size={12} />
                              <span>Очистить историю</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="push-settings-panel">
                      <div className="push-settings-intro">
                        <BellRing size={16} className="intro-bell-icon" />
                        <span>Умные уведомления о практиках и состояниях</span>
                      </div>

                      {browserPermission !== 'granted' && (
                        <button 
                          className="enable-browser-push-btn"
                          onClick={requestDesktopPermission}
                        >
                          <Bell size={14} />
                          <span>Включить Push в браузере</span>
                        </button>
                      )}

                      <div className="push-toggles-list">
                        <label className="push-toggle-row">
                          <div className="toggle-text">
                            <Sparkles size={16} className="text-amber" />
                            <div>
                              <strong>Утренняя аффирмация</strong>
                              <span>Ежедневный фокус и настрой (09:00)</span>
                            </div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={preferences.morningAffirmation}
                            onChange={e => updatePreferences({ morningAffirmation: e.target.checked })}
                            className="push-switch-input"
                          />
                        </label>

                        <label className="push-toggle-row">
                          <div className="toggle-text">
                            <Wind size={16} className="text-cyan" />
                            <div>
                              <strong>Дневной антистресс</strong>
                              <span>Пауза на дыхание 4-7-8 (14:00)</span>
                            </div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={preferences.afternoonBreathing}
                            onChange={e => updatePreferences({ afternoonBreathing: e.target.checked })}
                            className="push-switch-input"
                          />
                        </label>

                        <label className="push-toggle-row">
                          <div className="toggle-text">
                            <Heart size={16} className="text-pink" />
                            <div>
                              <strong>Вечерняя благодарность</strong>
                              <span>Запись в дневник осознанности (21:30)</span>
                            </div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={preferences.eveningGratitude}
                            onChange={e => updatePreferences({ eveningGratitude: e.target.checked })}
                            className="push-switch-input"
                          />
                        </label>
                      </div>

                      <div className="push-test-buttons-row">
                        <button 
                          className="test-push-btn"
                          onClick={() => triggerTestPush('affirmation')}
                        >
                          <span>Тест: Аффирмация</span>
                        </button>
                        <button 
                          className="test-push-btn"
                          onClick={() => triggerTestPush('breathing')}
                        >
                          <span>Тест: Дыхание</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

            <button
              className="header-action-btn header-settings-pill"
              onClick={() => {
                setSettingsInitialTab('preferences');
                setIsSettingsOpen(true);
              }}
              title="Настройки: тема день/ночь, язык, валюта, профиль"
            >
              <Settings size={16} />
              <span className="btn-text">Настройки</span>
            </button>

            <button
              className="header-action-btn header-qr-pill"
              onClick={() => setIsQrScannerOpen(true)}
              title="Сканировать QR-код для входа на компьютере"
            >
              <QrCode size={16} />
              <span className="btn-text">QR-код</span>
            </button>

            <button
              className="header-action-btn header-profile-badge"
              onClick={() => navigate(currentUser.username ? `/profile/@${currentUser.username}` : `/profile/${currentUser.id}`)}
              title={`Мой профиль: ${currentUser.name} (@${currentUser.username})`}
            >
              <img 
                src={getAvatarUrl(currentUser)} 
                alt={currentUser.name} 
                className="header-avatar" 
                onError={handleAvatarError}
              />
              <span className="header-profile-title">Мой профиль</span>
              {currentUser.isPremium && <PremiumBadge size="sm" />}
            </button>
          </>
        ) : (
          <div className="header-guest-auth-buttons">
            <button
              className="header-login-btn"
              onClick={() => setAuthModalOpen(true)}
            >
              <LogIn size={16} />
              <span>{t('header.login')}</span>
            </button>

            <button
              className="header-register-btn"
              onClick={() => navigate('/register')}
            >
              <Plus size={16} />
              <span>{t('header.register')}</span>
            </button>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onSuccess={() => {}}
      />

      {/* Global Settings & Profile Edit Modal */}
      {isAuthenticated && (
        <EditProfileModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={(updated) => {
            updateProfile(updated);
            setIsSettingsOpen(false);
          }}
          initialTab={settingsInitialTab}
          onOpenQrScanner={() => {
            setIsSettingsOpen(false);
            setIsQrScannerOpen(true);
          }}
          onLogout={() => {
            logout();
            navigate('/');
          }}
        />
      )}

      {/* Global QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
      />
    </header>
  );
}
