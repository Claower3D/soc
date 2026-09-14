import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Video, MessageCircle, PhoneCall, Headphones, 
  User as UserIcon, Tv, ShoppingBag, Users, Film, Wallet, ShieldAlert,
  ChevronDown, ChevronRight, Layers, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import './Sidebar.css';

export function Sidebar() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [servicesExpanded, setServicesExpanded] = useState(true);

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

        <NavLink to="/channel/me" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Tv className="nav-icon" size={19} />
          <span className="nav-label">Мой канал</span>
        </NavLink>

        <NavLink to="/profile/me" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UserIcon className="nav-icon" size={19} />
          <span className="nav-label">Мой профиль</span>
        </NavLink>
      </nav>

      {/* FOOTER USER CARD */}
      <div className="sidebar-footer">
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
      </div>
    </aside>
  );
}
