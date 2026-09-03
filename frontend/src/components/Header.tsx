import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Video, Headphones, MessageCircle, User as UserIcon, Bell, Check, Plus, Image as ImageIcon, PhoneCall } from 'lucide-react';
import { initialUsers, posts, videos, podcasts, currentUser, type User } from '../data/mock';
import './Header.css';

export function Header() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'videos' | 'podcasts' | 'posts'>('all');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter items based on query
  const trimmed = query.trim().toLowerCase();
  
  const filteredUsers = trimmed
    ? initialUsers.filter(u => u.name.toLowerCase().includes(trimmed) || u.username.toLowerCase().includes(trimmed))
    : [];

  const filteredVideos = trimmed
    ? videos.filter(v => v.title.toLowerCase().includes(trimmed) || v.channel.name.toLowerCase().includes(trimmed))
    : [];

  const filteredPodcasts = trimmed
    ? podcasts.filter(p => p.title.toLowerCase().includes(trimmed) || p.author.toLowerCase().includes(trimmed))
    : [];

  const filteredPosts = trimmed
    ? posts.filter(p => p.caption.toLowerCase().includes(trimmed) || p.user.name.toLowerCase().includes(trimmed))
    : [];

  const totalResults = filteredUsers.length + filteredVideos.length + filteredPodcasts.length + filteredPosts.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (createRef.current && !createRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (user: User) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/profile/${user.id === 'me' ? 'me' : user.id}`);
  };

  const handleSelectVideo = (_videoId: string) => {
    setIsOpen(false);
    setQuery('');
    navigate('/video');
  };

  const handleSelectPodcast = (_podcastId: string) => {
    setIsOpen(false);
    setQuery('');
    navigate('/podcasts');
  };

  const handleSelectPost = () => {
    setIsOpen(false);
    setQuery('');
    navigate('/');
  };

  return (
    <header className="global-header">
      <div className="header-search-container" ref={searchRef}>
        <div className={`search-input-wrapper ${isOpen ? 'focused' : ''}`}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Поиск людей, публикаций, видео, подкастов..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="global-search-input"
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')}>
              <X size={15} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="search-dropdown">
            {trimmed.length === 0 ? (
              <div className="search-quick-links">
                <div className="search-section-label">Быстрый переход</div>
                <div className="quick-suggestions">
                  {initialUsers.slice(0, 4).map(u => (
                    <button
                      key={u.id}
                      className="quick-user-pill"
                      onClick={() => handleSelectUser(u)}
                    >
                      <img src={u.avatar} alt={u.name} />
                      <span>{u.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : totalResults === 0 ? (
              <div className="search-empty-state">
                <p>Ничего не найдено по запросу «{query}»</p>
                <span>Попробуйте изменить поисковые слова</span>
              </div>
            ) : (
              <>
                <div className="search-tabs">
                  <button
                    className={`search-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                  >
                    Все ({totalResults})
                  </button>
                  <button
                    className={`search-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                  >
                    Люди ({filteredUsers.length})
                  </button>
                  <button
                    className={`search-tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('videos')}
                  >
                    Видео ({filteredVideos.length})
                  </button>
                  <button
                    className={`search-tab-btn ${activeTab === 'podcasts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('podcasts')}
                  >
                    Подкасты ({filteredPodcasts.length})
                  </button>
                  <button
                    className={`search-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                  >
                    Посты ({filteredPosts.length})
                  </button>
                </div>

                <div className="search-results-list">
                  {/* Users */}
                  {(activeTab === 'all' || activeTab === 'users') && filteredUsers.length > 0 && (
                    <div className="results-group">
                      <div className="group-title">
                        <UserIcon size={14} /> Пользователи
                      </div>
                      {filteredUsers.map(u => (
                        <div
                          key={u.id}
                          className="search-result-item"
                          onClick={() => handleSelectUser(u)}
                        >
                          <img src={u.avatar} alt={u.name} className="result-avatar" />
                          <div className="result-text">
                            <div className="result-title">{u.name}</div>
                            <div className="result-subtitle">@{u.username} · {u.followersCount.toLocaleString()} подписчиков</div>
                          </div>
                          <span className="result-action-badge">Профиль</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Videos */}
                  {(activeTab === 'all' || activeTab === 'videos') && filteredVideos.length > 0 && (
                    <div className="results-group">
                      <div className="group-title">
                        <Video size={14} /> Видео
                      </div>
                      {filteredVideos.map(v => (
                        <div
                          key={v.id}
                          className="search-result-item"
                          onClick={() => handleSelectVideo(v.id)}
                        >
                          <img src={v.thumbnail} alt={v.title} className="result-thumb-video" />
                          <div className="result-text">
                            <div className="result-title">{v.title}</div>
                            <div className="result-subtitle">{v.channel.name} · {v.views}</div>
                          </div>
                          <span className="result-duration">{v.duration}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Podcasts */}
                  {(activeTab === 'all' || activeTab === 'podcasts') && filteredPodcasts.length > 0 && (
                    <div className="results-group">
                      <div className="group-title">
                        <Headphones size={14} /> Подкасты
                      </div>
                      {filteredPodcasts.map(p => (
                        <div
                          key={p.id}
                          className="search-result-item"
                          onClick={() => handleSelectPodcast(p.id)}
                        >
                          <img src={p.cover} alt={p.title} className="result-thumb-square" />
                          <div className="result-text">
                            <div className="result-title">{p.title}</div>
                            <div className="result-subtitle">{p.author} · {p.episodes.length} эп.</div>
                          </div>
                          <span className="result-action-badge">Слушать</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Posts */}
                  {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
                    <div className="results-group">
                      <div className="group-title">
                        <MessageCircle size={14} /> Посты ленты
                      </div>
                      {filteredPosts.map(p => (
                        <div
                          key={p.id}
                          className="search-result-item"
                          onClick={() => handleSelectPost()}
                        >
                          <img src={p.image} alt="post" className="result-thumb-square" />
                          <div className="result-text">
                            <div className="result-title">{p.caption}</div>
                            <div className="result-subtitle">{p.user.name} · {p.timeAgo}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

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
                onClick={() => { setCreateMenuOpen(false); navigate('/'); }}
              >
                <ImageIcon size={18} color="#10B981" />
                <div className="create-item-text">
                  <strong>Публикация / Новость</strong>
                  <span>Поделиться фото или мыслями в ленте</span>
                </div>
              </button>

              <button 
                className="create-menu-item" 
                onClick={() => { setCreateMenuOpen(false); navigate('/video'); }}
              >
                <Video size={18} color="#EF4444" />
                <div className="create-item-text">
                  <strong>Загрузить видео</strong>
                  <span>Опубликовать видеоролик на канал</span>
                </div>
              </button>

              <button 
                className="create-menu-item" 
                onClick={() => { setCreateMenuOpen(false); navigate('/podcasts'); }}
              >
                <Headphones size={18} color="var(--color-accent)" />
                <div className="create-item-text">
                  <strong>Опубликовать подкаст</strong>
                  <span>Новый аудио-выпуск или шоу</span>
                </div>
              </button>

              <button 
                className="create-menu-item" 
                onClick={() => { setCreateMenuOpen(false); navigate('/conferences'); }}
              >
                <PhoneCall size={18} color="#3B82F6" />
                <div className="create-item-text">
                  <strong>Конференция</strong>
                  <span>Создать открытую или закрытую встречу</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <button
          className="header-action-btn conference-quick-btn"
          onClick={() => navigate('/conferences')}
          title="Быстрый старт конференции"
        >
          <Video size={17} />
          <span className="btn-text">Конференция</span>
        </button>

        <div className="notification-wrapper">
          <button
            className={`header-icon-btn ${notificationsOpen ? 'active' : ''}`}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Уведомления"
          >
            <Bell size={20} />
            <span className="notification-badge" />
          </button>

          {notificationsOpen && (
            <div className="notifications-popover">
              <div className="notifications-header">
                <h3>Уведомления</h3>
                <span className="notifications-mark-read"><Check size={14} /> Все прочитаны</span>
              </div>
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
            </div>
          )}
        </div>

        <button
          className="header-profile-badge"
          onClick={() => navigate('/profile/me')}
          title="Открыть Мой профиль"
        >
          <img src={currentUser.avatar} alt={currentUser.name} className="header-avatar" />
          <div className="header-profile-text">
            <span className="header-user-name">Мой профиль</span>
            <span className="header-user-handle">@{currentUser.username}</span>
          </div>
        </button>
      </div>
    </header>
  );
}
