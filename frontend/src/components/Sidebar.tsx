import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Video, MessageCircle, PhoneCall, Headphones, 
  User as UserIcon, Tv
} from 'lucide-react';
import { currentUser } from '../data/mock';
import './Sidebar.css';

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-header" onClick={() => navigate('/')}>
        <div className="demo-logo-pill">
          <span className="demo-badge">ДЕМО</span>
        </div>
        <span className="demo-subtext">социальная сеть</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Home className="nav-icon" size={20} />
          <span className="nav-label">Лента</span>
        </NavLink>

        <NavLink to="/video" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Video className="nav-icon" size={20} />
          <span className="nav-label">Видео</span>
        </NavLink>

        <NavLink to="/channel/me" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Tv className="nav-icon" size={20} />
          <span className="nav-label">Мой канал</span>
        </NavLink>

        <NavLink to="/messenger" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle className="nav-icon" size={20} />
          <span className="nav-label">Мессенджер</span>
          <span className="nav-badge">3</span>
        </NavLink>

        <NavLink to="/conferences" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PhoneCall className="nav-icon" size={20} />
          <span className="nav-label">Конференции</span>
          <span className="live-dot" title="В эфире" />
        </NavLink>

        <NavLink to="/podcasts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Headphones className="nav-icon" size={20} />
          <span className="nav-label">Подкасты</span>
        </NavLink>

        <div className="nav-divider" />

        <NavLink to="/profile/me" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UserIcon className="nav-icon" size={20} />
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
