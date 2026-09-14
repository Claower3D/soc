import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, Headphones,
  Bell, Check, Plus, Image as ImageIcon, PhoneCall, ShoppingBag, 
  Users, Film, LogIn, Sun, Moon, Sparkles, Wind, Heart, BellRing, Bot, Globe
} from 'lucide-react';
import { initialUsers } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useTranslation } from '../context/LanguageContext';
import { AuthModal } from './AuthModal';
import './Header.css';

export function Header() {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { preferences, updatePreferences, triggerTestPush, requestDesktopPermission, browserPermission } = useNotifications();
  const { currentLang, setLanguage, languages, t } = useTranslation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'alerts' | 'push_settings'>('alerts');
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (createRef.current && !createRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

        <button
          className="header-action-btn conference-quick-btn"
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal('register');
            } else {
              navigate('/conferences');
            }
          }}
          title="Быстрый старт конференции"
        >
          <Video size={17} />
          <span className="btn-text">Конференция</span>
        </button>

        {/* Cosmic AI Oracle / AI Guru Trigger */}
        <button
          className="header-action-btn ai-guru-quick-btn"
          onClick={() => navigate('/spiritual/livezen')}
          title="Спросить ИИ-Оракула и Наставника Live Zen"
        >
          <div className="ai-guru-btn-glow" />
          <div className="ai-guru-icon-box">
            <Sparkles size={14} className="ai-guru-sparkle" />
            <Bot size={16} className="ai-guru-bot" />
          </div>
          <div className="ai-guru-text-wrapper">
            <span className="ai-guru-title">ИИ Оракул</span>
            <span className="ai-guru-badge-pulse">LIVE ZEN</span>
          </div>
        </button>

        {/* Language Switcher Dropdown */}
        <div className="header-lang-wrapper" ref={langRef}>
          <button
            className={`header-icon-btn header-lang-btn ${langDropdownOpen ? 'active' : ''}`}
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            title="Выбор языка платформы / Select Language"
          >
            <span className="lang-active-flag">
              {languages.find((l) => l.code === currentLang)?.flag || '🌐'}
            </span>
            <span className="lang-active-code">{currentLang.toUpperCase()}</span>
          </button>

          {langDropdownOpen && (
            <div className="header-lang-dropdown">
              <div className="lang-dropdown-header">
                <Globe size={14} />
                <span>Язык / Language</span>
              </div>
              <div className="lang-options-list">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`lang-option-item ${currentLang === lang.code ? 'selected' : ''}`}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLangDropdownOpen(false);
                    }}
                  >
                    <span className="lang-item-flag">{lang.flag}</span>
                    <span className="lang-item-name">{lang.nativeName}</span>
                    <span className="lang-item-code">{lang.code.toUpperCase()}</span>
                    {currentLang === lang.code && <Check size={14} className="lang-check-icon" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button (Day / Night mode) */}
        <button
          className="header-icon-btn theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? "Переключить на дневную тему" : "Переключить на ночную тему (Zen Night)"}
        >
          {theme === 'dark' ? <Sun size={19} className="theme-sun-icon" /> : <Moon size={19} className="theme-moon-icon" />}
        </button>

        {/* Auth / Profile Area */}
        {isAuthenticated ? (
          <>
            <div className="notification-wrapper">
              <button
                className={`header-icon-btn ${notificationsOpen ? 'active' : ''}`}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Уведомления и Push-напоминания"
              >
                <Bell size={20} />
                <span className="notification-badge" />
              </button>

              {notificationsOpen && (
                <div className="notifications-popover">
                  <div className="notifications-header">
                    <div className="notif-popover-tabs">
                      <button 
                        className={`notif-tab-btn ${notifTab === 'alerts' ? 'active' : ''}`}
                        onClick={() => setNotifTab('alerts')}
                      >
                        События
                      </button>
                      <button 
                        className={`notif-tab-btn ${notifTab === 'push_settings' ? 'active' : ''}`}
                        onClick={() => setNotifTab('push_settings')}
                      >
                        Push-напоминания
                      </button>
                    </div>
                    {notifTab === 'alerts' && (
                      <span className="notifications-mark-read"><Check size={14} /> Прочитано</span>
                    )}
                  </div>

                  {notifTab === 'alerts' ? (
                    <div className="notifications-list">
                      <div className="notification-item unread">
                        <img src={initialUsers[1].avatar} alt="Алиса" />
                        <div className="notif-content">
                          <p><strong>Алиса Иванова</strong> оценила вашу публикацию</p>
                          <span className="notif-time">5 минут назад</span>
                        </div>
                      </div>
                      <div className="notification-item unread">
                        <img src={initialUsers[2].avatar} alt="Максим" />
                        <div className="notif-content">
                          <p><strong>Максим Петров</strong> пригласил вас в <strong>Конференцию</strong></p>
                          <span className="notif-time">12 минут назад</span>
                        </div>
                      </div>
                      <div className="notification-item">
                        <img src={initialUsers[3].avatar} alt="Екатерина" />
                        <div className="notif-content">
                          <p><strong>Екатерина Смирнова</strong> подписалась на ваши обновления</p>
                          <span className="notif-time">1 час назад</span>
                        </div>
                      </div>
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
              )}
            </div>

            <button
              className="header-profile-badge"
              onClick={() => navigate(currentUser.username ? `/profile/@${currentUser.username}` : `/profile/${currentUser.id}`)}
              title={`Мой профиль: ${currentUser.name} (@${currentUser.username})`}
            >
              <img src={currentUser.avatar} alt={currentUser.name} className="header-avatar" />
              <div className="header-profile-text">
                <span className="header-user-name">{currentUser.name.split(' ')[0]}</span>
                <span className="header-user-handle">@{currentUser.username}</span>
              </div>
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
    </header>
  );
}
