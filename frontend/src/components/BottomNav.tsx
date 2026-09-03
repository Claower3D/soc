import { NavLink } from 'react-router-dom';
import { Home, Video, MessageCircle, PhoneCall, Headphones, User } from 'lucide-react';
import './BottomNav.css';

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end>
        <Home className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Лента</span>
      </NavLink>

      <NavLink to="/video" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Video className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Видео</span>
      </NavLink>

      <NavLink to="/messenger" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <MessageCircle className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Чат</span>
      </NavLink>

      <NavLink to="/conferences" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <PhoneCall className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Конференции</span>
      </NavLink>

      <NavLink to="/podcasts" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Headphones className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Подкасты</span>
      </NavLink>

      <NavLink to="/profile/me" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <User className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Профиль</span>
      </NavLink>
    </nav>
  );
}
