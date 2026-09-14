import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Video, MessageCircle, PhoneCall, Headphones, 
  User as UserIcon, Tv, ShoppingBag, Users, Film, Wallet, ShieldAlert
} from 'lucide-react';
import { currentUser } from '../data/mock';
import './Sidebar.css';

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-header" onClick={() => navigate('/')}>
        <div className="demo-logo-pill new-age-logo-pill">
          <span className="demo-badge new-age-badge">NEW AGE</span>
        </div>
        <span className="demo-subtext">социальная экосистема</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Home className="nav-icon" size={19} />
          <span className="nav-label">Лента</span>
        </NavLink>

        <NavLink to="/video" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Video className="nav-icon" size={19} />
          <span className="nav-label">Видео</span>
        </NavLink>

        <NavLink to="/channel/me" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Tv className="nav-icon" size={19} />
          <span className="nav-label">Мой канал</span>
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

        <div className="nav-section-title">Сервисы</div>

        <NavLink to="/marketplace" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShoppingBag className="nav-icon" size={19} />
          <span className="nav-label">Маркетплейс</span>
        </NavLink>

        <NavLink to="/communities" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users className="nav-icon" size={19} />
          <span className="nav-label">Сообщества</span>
        </NavLink>

        <NavLink to="/editor" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Film className="nav-icon" size={19} />
          <span className="nav-label">Видеостудия</span>
        </NavLink>

        <NavLink to="/wallet" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wallet className="nav-icon" size={19} />
          <span className="nav-label">Кошелёк</span>
        </NavLink>

        <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShieldAlert className="nav-icon" size={19} />
          <span className="nav-label">Админ-панель</span>
        </NavLink>

        <div className="nav-divider" />

        <NavLink to="/profile/me" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UserIcon className="nav-icon" size={19} />
          <span className="nav-label">Мой профиль</span>
        </NavLink>
      </nav>

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
