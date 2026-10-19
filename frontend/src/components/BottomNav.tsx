import { NavLink, useLocation } from 'react-router-dom';
import { Home, Video, MessageCircle, Layers, User, Sparkles, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

export function BottomNav() {
  const { isAuthenticated, openAuthModal, currentUser } = useAuth();
  const location = useLocation();

  const handleClipsClick = (e: React.MouseEvent) => {
    if (location.pathname === '/clips') {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('open_clip_upload'));
    }
  };

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`} end>
        <Home className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Лента</span>
      </NavLink>

      <NavLink to="/spiritual" className={({ isActive }) => `bottom-nav-item bottom-nav-spiritual ${isActive ? 'active' : ''}`}>
        <Sparkles className="bottom-nav-icon spiritual-star-icon" size={20} />
        <span className="bottom-nav-label">Самопознание</span>
      </NavLink>

      <NavLink to="/video" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Video className="bottom-nav-icon" size={20} />
        <span className="bottom-nav-label">Видео</span>
      </NavLink>

      {/* Клипы в центре со стильной кнопкой + */}
      <NavLink 
        to="/clips" 
        onClick={handleClipsClick}
        className={({ isActive }) => `bottom-nav-item bottom-nav-center-item ${isActive ? 'active' : ''}`}
        title="Клипы и публикация"
      >
        <div className="bottom-nav-center-fab">
          <Plus size={22} color="#ffffff" strokeWidth={2.8} />
        </div>
        <span className="bottom-nav-label">Клипы</span>
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
