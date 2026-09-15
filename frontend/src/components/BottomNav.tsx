import { NavLink } from 'react-router-dom';
import { Home, Search, Video, MessageCircle, Layers, User, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

export function BottomNav() {
  const { isAuthenticated, openAuthModal, currentUser } = useAuth();

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end>
        <Home className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Лента</span>
      </NavLink>

      <NavLink to="/clips" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Film className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Клипы</span>
      </NavLink>

      <NavLink to="/search" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Search className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Поиск</span>
      </NavLink>

      <NavLink to="/video" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Video className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Видео</span>
      </NavLink>

      {isAuthenticated ? (
        <NavLink to="/messenger" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <MessageCircle className="bottom-nav-icon" size={20} />
          <span className="bottom-nav-label">Чат</span>
        </NavLink>
      ) : (
        <button 
          type="button" 
          className="bottom-nav-item bottom-nav-btn-guest" 
          onClick={() => openAuthModal('register')}
          title="Вход в аккаунт"
        >
          <MessageCircle className="bottom-nav-icon" size={20} />
          <span className="bottom-nav-label">Чат</span>
        </button>
      )}

      {isAuthenticated ? (
        <NavLink to="/services" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
          <Layers className="bottom-nav-icon" size={20} />
          <span className="bottom-nav-label">Сервисы</span>
        </NavLink>
      ) : (
        <button 
          type="button" 
          className="bottom-nav-item bottom-nav-btn-guest" 
          onClick={() => openAuthModal('register')}
          title="Вход в аккаунт"
        >
          <Layers className="bottom-nav-icon" size={20} />
          <span className="bottom-nav-label">Сервисы</span>
        </button>
      )}

      {isAuthenticated ? (
        <NavLink 
          to={currentUser?.username ? `/profile/@${currentUser.username}` : `/profile/${currentUser?.id || 'me'}`} 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <User className="bottom-nav-icon" size={20} />
          <span className="bottom-nav-label">Профиль</span>
        </NavLink>
      ) : (
        <button 
          type="button" 
          className="bottom-nav-item bottom-nav-btn-guest" 
          onClick={() => openAuthModal('register')}
          title="Вход в аккаунт"
        >
          <User className="bottom-nav-icon" size={20} />
          <span className="bottom-nav-label">Войти</span>
        </button>
      )}
    </nav>
  );
}
