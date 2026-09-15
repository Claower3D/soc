import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Search, Video, MessageCircle, PhoneCall, Headphones, 
  User as UserIcon, Tv, ShoppingBag, Users, Film, Wallet, ShieldAlert,
  ChevronDown, ChevronRight, Layers, ExternalLink,
  Flower2, Activity, Sunrise, Wind, Waves, BookOpen, Sparkles, GraduationCap, Lock,
  Compass, Calendar as CalendarIcon, Bot, Brain
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { AuthModal } from './AuthModal';
import logoImg from '../assets/logo.png';
import './Sidebar.css';

export function Sidebar() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [spiritualExpanded, setSpiritualExpanded] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <aside className="sidebar">
      {/* Brand Header with Uploaded Official Logo */}
      <div className="sidebar-header" onClick={() => navigate('/')}>
        <div className="brand-logo-container">
          <div className="brand-logo-glow-wrapper">
            <img 
              src={logoImg} 
              alt="New Age Logo" 
              className="brand-logo-img" 
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="brand-text-block">
            <span className="demo-badge new-age-badge">NEW AGE</span>
            <span className="demo-subtext">социальная экосистема</span>
            <span className="brand-motto-tag" title="Официальный девиз">«Спасение служба»</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* SECTION 1: CORE COMMUNICATION & CONTENT */}
        <div className="nav-section-title">Основное</div>

        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Home className="nav-icon" size={19} />
          <span className="nav-label">{t('nav.feed')}</span>
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Search className="nav-icon" size={19} />
          <span className="nav-label">Поиск</span>
        </NavLink>

        <NavLink to="/clips" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Film className="nav-icon" size={19} />
          <span className="nav-label">{t('nav.clips')}</span>
          <span className="nav-badge-hot" style={{
            fontSize: '10px',
            background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
            color: '#fff',
            padding: '1px 6px',
            borderRadius: '10px',
            fontWeight: 700,
            marginLeft: 'auto'
          }}>HOT</span>
        </NavLink>

        <NavLink to="/video" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Video className="nav-icon" size={19} />
          <span className="nav-label">{t('nav.video')}</span>
        </NavLink>

        {isAuthenticated ? (
          <NavLink to="/messenger" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MessageCircle className="nav-icon" size={19} />
            <span className="nav-label">{t('nav.messenger')}</span>
            <span className="nav-badge">3</span>
          </NavLink>
        ) : (
          <div 
            className="nav-item guest-locked-nav" 
            onClick={() => setAuthModalOpen(true)}
            title="Мессенджер доступен после регистрации"
          >
            <MessageCircle className="nav-icon" size={19} />
            <span className="nav-label">{t('nav.messenger')}</span>
            <span className="nav-lock-badge"><Lock size={12} /></span>
          </div>
        )}

        {isAuthenticated ? (
          <NavLink to="/conferences" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <PhoneCall className="nav-icon" size={19} />
            <span className="nav-label">{t('nav.calls')}</span>
            <span className="live-dot" title="В эфире" />
          </NavLink>
        ) : (
          <div 
            className="nav-item guest-locked-nav" 
            onClick={() => setAuthModalOpen(true)}
            title="Конференции доступны после регистрации"
          >
            <PhoneCall className="nav-icon" size={19} />
            <span className="nav-label">{t('nav.calls')}</span>
            <span className="nav-lock-badge"><Lock size={12} /></span>
          </div>
        )}

        {isAuthenticated ? (
          <NavLink to="/podcasts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Headphones className="nav-icon" size={19} />
            <span className="nav-label">{t('nav.podcasts')}</span>
          </NavLink>
        ) : (
          <div 
            className="nav-item guest-locked-nav" 
            onClick={() => setAuthModalOpen(true)}
            title="Подкасты доступны после регистрации"
          >
            <Headphones className="nav-icon" size={19} />
            <span className="nav-label">{t('nav.podcasts')}</span>
            <span className="nav-lock-badge"><Lock size={12} /></span>
          </div>
        )}

        {/* SECTION: САМОПОЗНАНИЕ & ДУХОВНЫЕ ПРАКТИКИ */}
        <div className="nav-section-divider" />
        
        {/* Collapsed Shortcut Icon */}
        <NavLink 
          to="/spiritual" 
          className={({ isActive }) => `sidebar-section-collapsed-icon ${isActive ? 'active' : ''}`}
          title="Самопознание и практики"
        >
          <Sparkles className="nav-icon spiritual-star-icon" size={19} />
        </NavLink>

        <div className="services-section-header spiritual-section-header">
          <button 
            type="button" 
            className="services-accordion-toggle spiritual-accordion-toggle"
            onClick={() => setSpiritualExpanded(!spiritualExpanded)}
            title={spiritualExpanded ? "Свернуть самопознание" : "Развернуть самопознание"}
          >
            <div className="services-header-title">
              <Sparkles size={14} className="services-header-icon spiritual-star-icon" />
              <span>Самопознание</span>
            </div>
            {spiritualExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isAuthenticated ? (
            <NavLink 
              to="/spiritual" 
              className="services-hub-link" 
              title="Центр самопознания и практик (Все разделы)"
            >
              <span>Все</span>
              <ExternalLink size={11} />
            </NavLink>
          ) : (
            <div 
              className="services-hub-link guest-locked-hub-link"
              onClick={() => setAuthModalOpen(true)}
              title="Доступно после регистрации"
            >
              <span>Все</span>
              <Lock size={10} />
            </div>
          )}
        </div>

        {spiritualExpanded && (
          <div className="services-subnav spiritual-subnav">
            {isAuthenticated ? (
              <>
                <NavLink to="/spiritual/meditation" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <Flower2 className="nav-icon spiritual-icon-flower" size={18} />
                  <span className="nav-label">Медитация</span>
                </NavLink>

                <NavLink to="/spiritual/yoga" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <Activity className="nav-icon spiritual-icon-yoga" size={18} />
                  <span className="nav-label">Йога</span>
                </NavLink>

                <NavLink to="/spiritual/affirmations" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <Sunrise className="nav-icon spiritual-icon-affirm" size={18} />
                  <span className="nav-label">Аффирмации</span>
                </NavLink>

                <NavLink to="/spiritual/breathing" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <Wind className="nav-icon spiritual-icon-wind" size={18} />
                  <span className="nav-label">Дыхание</span>
                </NavLink>

                <NavLink to="/spiritual/sounds" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <Waves className="nav-icon spiritual-icon-waves" size={18} />
                  <span className="nav-label">Звуки & Мантры</span>
                </NavLink>

                <NavLink to="/spiritual/wisdom" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <BookOpen className="nav-icon spiritual-icon-wisdom" size={18} />
                  <span className="nav-label">Мудрость</span>
                </NavLink>

                <NavLink to="/spiritual/courses" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <GraduationCap className="nav-icon spiritual-icon-courses" size={18} />
                  <span className="nav-label">Курсы & Маркет</span>
                  <span className="spiritual-sub-badge promo-badge">PRO</span>
                </NavLink>

                <NavLink to="/spiritual/tarot" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <Sparkles className="nav-icon spiritual-icon-flower" size={18} />
                  <span className="nav-label">Таро & МАК</span>
                  <span className="spiritual-sub-badge">3D</span>
                </NavLink>

                <NavLink to="/spiritual/astrology" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <Compass className="nav-icon spiritual-icon-yoga" size={18} />
                  <span className="nav-label">Натальная карта</span>
                </NavLink>

                <NavLink to="/spiritual/calendar" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <CalendarIcon className="nav-icon spiritual-icon-affirm" size={18} />
                  <span className="nav-label">Календарь</span>
                </NavLink>

                <NavLink to="/spiritual/livezen" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <Bot className="nav-icon spiritual-icon-waves" size={18} />
                  <span className="nav-label">Live Zen & ИИ</span>
                  <span className="spiritual-sub-badge" style={{ background: '#22c55e', color: '#fff' }}>LIVE</span>
                </NavLink>

                <NavLink to="/spiritual/consciousness" className={({ isActive }) => `nav-item sub-nav-item spiritual-nav-item ${isActive ? 'active' : ''}`}>
                  <Brain className="nav-icon spiritual-icon-flower" size={18} />
                  <span className="nav-label">Класс Сознания</span>
                  <span className="spiritual-sub-badge" style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', color: '#fff' }}>1-11</span>
                </NavLink>
              </>
            ) : (
              <>
                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Flower2 className="nav-icon spiritual-icon-flower" size={18} />
                  <span className="nav-label">Медитация</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Activity className="nav-icon spiritual-icon-yoga" size={18} />
                  <span className="nav-label">Йога</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Sunrise className="nav-icon spiritual-icon-affirm" size={18} />
                  <span className="nav-label">Аффирмации</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Wind className="nav-icon spiritual-icon-wind" size={18} />
                  <span className="nav-label">Дыхание</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Waves className="nav-icon spiritual-icon-waves" size={18} />
                  <span className="nav-label">Звуки & Мантры</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <BookOpen className="nav-icon spiritual-icon-wisdom" size={18} />
                  <span className="nav-label">Мудрость</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <GraduationCap className="nav-icon spiritual-icon-courses" size={18} />
                  <span className="nav-label">Курсы & Маркет</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Sparkles className="nav-icon spiritual-icon-flower" size={18} />
                  <span className="nav-label">Таро & МАК</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Compass className="nav-icon spiritual-icon-yoga" size={18} />
                  <span className="nav-label">Натальная карта</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <CalendarIcon className="nav-icon spiritual-icon-affirm" size={18} />
                  <span className="nav-label">Календарь</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Bot className="nav-icon spiritual-icon-waves" size={18} />
                  <span className="nav-label">Live Zen & ИИ</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item spiritual-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Brain className="nav-icon spiritual-icon-flower" size={18} />
                  <span className="nav-label">Класс Сознания</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>
              </>
            )}
          </div>
        )}

        {/* SECTION 2: SERVICES ACCORDION & HUB */}
        <div className="nav-section-divider" />
        
        {/* Collapsed Shortcut Icon */}
        <NavLink 
          to="/services" 
          className={({ isActive }) => `sidebar-section-collapsed-icon ${isActive ? 'active' : ''}`}
          title="Сервисы и инструменты"
        >
          <Layers className="nav-icon" size={19} />
        </NavLink>

        <div className="services-section-header">
          <button 
            type="button" 
            className="services-accordion-toggle"
            onClick={() => setServicesExpanded(!servicesExpanded)}
            title={servicesExpanded ? "Свернуть сервисы" : "Развернуть сервисы"}
          >
            <div className="services-header-title">
              <Layers size={14} className="services-header-icon" />
              <span>Сервисы</span>
            </div>
            {servicesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {isAuthenticated ? (
            <NavLink 
              to="/services" 
              className="services-hub-link" 
              title="Все сервисы экосистемы (витрина)"
            >
              <span>Все</span>
              <ExternalLink size={11} />
            </NavLink>
          ) : (
            <div 
              className="services-hub-link guest-locked-hub-link"
              onClick={() => setAuthModalOpen(true)}
              title="Доступно после регистрации"
            >
              <span>Все</span>
              <Lock size={10} />
            </div>
          )}
        </div>

        {servicesExpanded && (
          <div className="services-subnav">
            {isAuthenticated ? (
              <>
                <NavLink to="/marketplace" className={({ isActive }) => `nav-item sub-nav-item ${isActive ? 'active' : ''}`}>
                  <ShoppingBag className="nav-icon service-icon-market" size={18} />
                  <span className="nav-label">Маркетплейс</span>
                </NavLink>

                <NavLink to="/communities" className={({ isActive }) => `nav-item sub-nav-item ${isActive ? 'active' : ''}`}>
                  <Users className="nav-icon service-icon-comm" size={18} />
                  <span className="nav-label">Сообщества</span>
                </NavLink>

                <NavLink to="/editor" className={({ isActive }) => `nav-item sub-nav-item ${isActive ? 'active' : ''}`}>
                  <Film className="nav-icon service-icon-editor" size={18} />
                  <span className="nav-label">Видеостудия</span>
                </NavLink>

                <NavLink to="/wallet" className={({ isActive }) => `nav-item sub-nav-item ${isActive ? 'active' : ''}`}>
                  <Wallet className="nav-icon service-icon-wallet" size={18} />
                  <span className="nav-label">Кошелёк</span>
                </NavLink>

                <NavLink to="/admin" className={({ isActive }) => `nav-item sub-nav-item ${isActive ? 'active' : ''}`}>
                  <ShieldAlert className="nav-icon service-icon-admin" size={18} />
                  <span className="nav-label">Админ-панель</span>
                </NavLink>
              </>
            ) : (
              <>
                <div className="nav-item sub-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <ShoppingBag className="nav-icon service-icon-market" size={18} />
                  <span className="nav-label">Маркетплейс</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Users className="nav-icon service-icon-comm" size={18} />
                  <span className="nav-label">Сообщества</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Film className="nav-icon service-icon-editor" size={18} />
                  <span className="nav-label">Видеостудия</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <Wallet className="nav-icon service-icon-wallet" size={18} />
                  <span className="nav-label">Кошелёк</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>

                <div className="nav-item sub-nav-item guest-locked-nav" onClick={() => setAuthModalOpen(true)}>
                  <ShieldAlert className="nav-icon service-icon-admin" size={18} />
                  <span className="nav-label">Админ-панель</span>
                  <span className="nav-lock-badge"><Lock size={12} /></span>
                </div>
              </>
            )}
          </div>
        )}

        {/* SECTION 3: PERSONAL */}
        <div className="nav-section-divider" />
        <div className="nav-section-title">Кабинет</div>

        {isAuthenticated ? (
          <>
            <NavLink to="/channel/me" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Tv className="nav-icon" size={19} />
              <span className="nav-label">Мой канал</span>
            </NavLink>

            <NavLink 
              to={currentUser.username ? `/profile/@${currentUser.username}` : `/profile/${currentUser.id}`} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <UserIcon className="nav-icon" size={19} />
              <span className="nav-label">Мой профиль</span>
            </NavLink>
          </>
        ) : (
          <div className="nav-item guest-nav-item" onClick={() => setAuthModalOpen(true)}>
            <UserIcon className="nav-icon" size={19} />
            <span className="nav-label">Войти в профиль</span>
          </div>
        )}
      </nav>

      {/* FOOTER USER CARD / GUEST CARD */}
      <div className="sidebar-footer">
        {isAuthenticated ? (
          <div 
            className="user-profile-card"
            onClick={() => navigate(currentUser.username ? `/profile/@${currentUser.username}` : `/profile/${currentUser.id}`)}
            title="Перейти в Мой профиль"
          >
            <div className="footer-avatar-wrapper">
              <img src={currentUser.avatar} alt={currentUser.name} className="footer-user-avatar" />
              <span className="footer-online-dot" />
            </div>
            <div className="footer-user-info">
              <span className="footer-user-name">{currentUser.name}</span>
              <span className="footer-user-handle">@{currentUser.username}</span>
            </div>
          </div>
        ) : (
          <div 
            className="sidebar-guest-card"
            onClick={() => setAuthModalOpen(true)}
            title="Войти или зарегистрироваться в New Age"
          >
            <div className="guest-card-left">
              <div className="guest-avatar-ring">
                <UserIcon size={18} className="guest-icon" />
              </div>
              <div className="guest-text-block">
                <span className="guest-title">Гостевой режим</span>
                <span className="guest-subtitle">Нажмите для входа</span>
              </div>
            </div>
            <button className="guest-login-arrow-btn">
              Войти
            </button>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
        onSuccess={() => {}}
      />
    </aside>
  );
}
