import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Video, MessageCircle, PhoneCall, Headphones, 
  User as UserIcon, Tv, ShoppingBag, Users, Film, Wallet, ShieldAlert,
  ChevronDown, ChevronRight, Layers, ExternalLink,
  Flower2, Activity, Sunrise, Wind, Waves, BookOpen, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import logoImg from '../assets/logo.png';
import './Sidebar.css';

export function Sidebar() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
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
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* SECTION 1: CORE COMMUNICATION & CONTENT */}
        <div className="nav-section-title">Основное</div>

        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Home className="nav-icon" size={19} />
          <span className="nav-label">Лента</span>
        </NavLink>

        <NavLink to="/video" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Video className="nav-icon" size={19} />
          <span className="nav-label">Видео</span>
        </NavLink>

        <NavLink to="/messenger" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle className="nav-icon" size={19} />
          <span className="nav-label">Мессенджер</span>
          <span className="nav-badge">3</span>
        </NavLink>

        <NavLink to="/conferences" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PhoneCall className="nav-icon" size={19} />
          <span className="nav-label">Конференции</span>
          <span className="live-dot" title="В эфире" />
        </NavLink>

        <NavLink to="/podcasts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Headphones className="nav-icon" size={19} />
          <span className="nav-label">Подкасты</span>
        </NavLink>

        {/* SECTION: САМОПОЗНАНИЕ & ДУХОВНЫЕ ПРАКТИКИ */}
        <div className="nav-section-divider" />
        
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

          <NavLink 
            to="/spiritual" 
            className="services-hub-link" 
            title="Центр самопознания и практик (Все разделы)"
          >
            <span>Все</span>
            <ExternalLink size={11} />
          </NavLink>
        </div>

        {spiritualExpanded && (
          <div className="services-subnav spiritual-subnav">
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
          </div>
        )}

        {/* SECTION 2: SERVICES ACCORDION & HUB */}
        <div className="nav-section-divider" />
        
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

          <NavLink 
            to="/services" 
            className="services-hub-link" 
            title="Все сервисы экосистемы (витрина)"
          >
            <span>Все</span>
            <ExternalLink size={11} />
          </NavLink>
        </div>

        {servicesExpanded && (
          <div className="services-subnav">
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

            <NavLink to="/profile/me" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
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
            onClick={() => navigate('/profile/me')}
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
