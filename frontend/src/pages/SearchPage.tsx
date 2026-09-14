import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, X, User as UserIcon, Video as VideoIcon, 
  Image as ImageIcon, Heart, MessageCircle, Play, 
  Check, UserPlus, Flame, Sparkles
} from 'lucide-react';
import { posts, videos, type Post } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { PostDetailModal } from '../components/PostDetailModal';
import { 
  getAllUsersPool, 
  getStoredFollowingIds, 
  toggleUserFollow 
} from '../utils/followStorage';
import './SearchPage.css';

type SearchTab = 'all' | 'accounts' | 'videos' | 'posts';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, allAccounts, isAuthenticated, openAuthModal } = useAuth();

  const queryParam = searchParams.get('q') || '';
  const tabParam = (searchParams.get('tab') as SearchTab) || 'all';

  const [query, setQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<SearchTab>(tabParam);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>(() => getStoredFollowingIds());

  // Listen to follow updates
  useEffect(() => {
    const handleSync = () => setFollowingIds(getStoredFollowingIds());
    window.addEventListener('follow_change', handleSync);
    return () => window.removeEventListener('follow_change', handleSync);
  }, []);

  // Synchronize internal state with URL query parameters
  useEffect(() => {
    if (queryParam !== query) {
      setQuery(queryParam);
    }
  }, [queryParam]);

  useEffect(() => {
    if (tabParam !== activeTab && ['all', 'accounts', 'videos', 'posts'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleSearchChange = (newQuery: string) => {
    setQuery(newQuery);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newQuery.trim()) {
        next.set('q', newQuery);
      } else {
        next.delete('q');
      }
      return next;
    }, { replace: true });
  };

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'all') {
        next.delete('tab');
      } else {
        next.set('tab', tab);
      }
      return next;
    });
  };

  const handleToggleFollow = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('register');
      return;
    }
    toggleUserFollow(userId);
    setFollowingIds(getStoredFollowingIds());
  };

  const poolUsers = useMemo(() => {
    return getAllUsersPool(currentUser, allAccounts);
  }, [currentUser, allAccounts]);

  const trimmed = query.trim().toLowerCase();

  // Filtered lists
  const filteredUsers = useMemo(() => {
    if (!trimmed) {
      return poolUsers.filter(u => u.id !== currentUser?.id && u.id !== 'guest');
    }
    return poolUsers.filter(u => 
      u.name.toLowerCase().includes(trimmed) || 
      u.username.toLowerCase().includes(trimmed) ||
      (u.bio && u.bio.toLowerCase().includes(trimmed))
    );
  }, [poolUsers, trimmed, currentUser]);

  const filteredVideos = useMemo(() => {
    if (!trimmed) return videos;
    return videos.filter(v => 
      v.title.toLowerCase().includes(trimmed) || 
      v.description.toLowerCase().includes(trimmed) ||
      v.channel.name.toLowerCase().includes(trimmed)
    );
  }, [trimmed]);

  const filteredPosts = useMemo(() => {
    if (!trimmed) return posts;
    return posts.filter(p => 
      p.caption.toLowerCase().includes(trimmed) || 
      p.user.name.toLowerCase().includes(trimmed) ||
      p.user.username.toLowerCase().includes(trimmed)
    );
  }, [trimmed]);

  const totalResultsCount = filteredUsers.length + filteredVideos.length + filteredPosts.length;

  return (
    <div className="search-explore-page">
      {/* Top Search Bar & Instagram-Style Header */}
      <div className="search-explore-header">
        <div className="search-explore-input-box">
          <Search size={20} className="search-explore-icon" />
          <input
            type="text"
            className="search-explore-input"
            placeholder="Поиск по аккаунтам, видео и публикациям..."
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            autoFocus
          />
          {query && (
            <button 
              type="button" 
              className="search-explore-clear"
              onClick={() => handleSearchChange('')}
              title="Очистить"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Section Tabs: Все, Аккаунты, Видео, Публикации */}
        <div className="search-explore-tabs">
          <button 
            type="button"
            className={`search-tab-pill ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            <Sparkles size={16} />
            <span>Все</span>
            {trimmed && <span className="tab-badge">{totalResultsCount}</span>}
          </button>

          <button 
            type="button"
            className={`search-tab-pill ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => handleTabChange('accounts')}
          >
            <UserIcon size={16} />
            <span>Аккаунты</span>
            <span className="tab-badge">{filteredUsers.length}</span>
          </button>

          <button 
            type="button"
            className={`search-tab-pill ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => handleTabChange('videos')}
          >
            <VideoIcon size={16} />
            <span>Видео</span>
            <span className="tab-badge">{filteredVideos.length}</span>
          </button>

          <button 
            type="button"
            className={`search-tab-pill ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => handleTabChange('posts')}
          >
            <ImageIcon size={16} />
            <span>Публикации</span>
            <span className="tab-badge">{filteredPosts.length}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="search-explore-content">

        {/* --- TAB: ALL (Instagram Explore mixed view) --- */}
        {activeTab === 'all' && (
          <div className="search-section-all">
            {/* Top Accounts Preview */}
            <div className="search-block">
              <div className="search-block-header">
                <h3>Аккаунты и люди</h3>
                {filteredUsers.length > 4 && (
                  <button className="search-view-all-link" onClick={() => handleTabChange('accounts')}>
                    Смотреть все ({filteredUsers.length})
                  </button>
                )}
              </div>
              {filteredUsers.length === 0 ? (
                <div className="search-empty-sub">Аккаунты не найдены</div>
              ) : (
                <div className="search-accounts-grid">
                  {filteredUsers.slice(0, 4).map(user => {
                    const isSubscribed = followingIds.includes(user.id);
                    const isMe = user.id === currentUser?.id;
                    return (
                      <div 
                        key={user.id} 
                        className="search-account-card"
                        onClick={() => navigate(user.username ? `/profile/@${user.username}` : `/profile/${user.id}`)}
                      >
                        <div className="account-card-avatar-wrap">
                          <img src={user.avatar} alt={user.name} className="account-card-avatar" />
                          {user.online && <span className="account-online-dot" />}
                        </div>
                        <div className="account-card-details">
                          <span className="account-card-name">{user.name}</span>
                          <span className="account-card-username">@{user.username}</span>
                          <span className="account-card-followers">{user.followersCount || 1} подписчиков</span>
                        </div>
                        {!isMe && (
                          <button
                            type="button"
                            className={`account-card-follow-btn ${isSubscribed ? 'following' : ''}`}
                            onClick={(e) => handleToggleFollow(user.id, e)}
                          >
                            {isSubscribed ? <Check size={14} /> : <UserPlus size={14} />}
                            <span>{isSubscribed ? 'Подписки' : 'Подписаться'}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Explore Media Grid (Instagram 3-column mixed photos & video reels) */}
            <div className="search-block">
              <div className="search-block-header">
                <h3>Интересное и публикации</h3>
                <span className="search-hint-sub">Популярный контент сообщества</span>
              </div>
              
              <div className="explore-media-grid">
                {filteredPosts.map((post, idx) => {
                  const isVideoStyle = idx % 5 === 2; // Mixed Reels-style tile
                  return (
                    <div 
                      key={post.id} 
                      className={`explore-media-item ${isVideoStyle ? 'explore-tall' : ''}`}
                      onClick={() => setSelectedPost(post)}
                    >
                      <img src={post.image} alt={post.caption} className="explore-media-thumb" />
                      
                      {isVideoStyle && (
                        <div className="explore-video-badge">
                          <Play size={14} fill="currentColor" />
                          <span>Reels</span>
                        </div>
                      )}

                      {/* Instagram Hover Stats Overlay */}
                      <div className="explore-hover-overlay">
                        <div className="explore-hover-stat">
                          <Heart size={18} fill="white" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="explore-hover-stat">
                          <MessageCircle size={18} fill="white" />
                          <span>{post.comments.length}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Video Section Preview */}
            <div className="search-block">
              <div className="search-block-header">
                <h3>Рекомендуемые видеоролики</h3>
                <button className="search-view-all-link" onClick={() => handleTabChange('videos')}>
                  В раздел видео ({filteredVideos.length})
                </button>
              </div>

              <div className="search-videos-grid">
                {filteredVideos.slice(0, 4).map(video => (
                  <div 
                    key={video.id} 
                    className="search-video-card"
                    onClick={() => navigate('/video')}
                  >
                    <div className="search-video-thumb-box">
                      <img src={video.thumbnail} alt={video.title} className="search-video-img" />
                      <span className="search-video-duration">{video.duration}</span>
                      <div className="search-video-play-hint">
                        <Play size={20} fill="white" />
                      </div>
                    </div>
                    <div className="search-video-info">
                      <h4 className="search-video-title">{video.title}</h4>
                      <div className="search-video-author">
                        <img src={video.channel.avatar} alt={video.channel.name} className="search-video-channel-avatar" />
                        <span>{video.channel.name}</span>
                      </div>
                      <div className="search-video-meta">
                        <span>{video.views}</span> • <span>{video.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: ACCOUNTS --- */}
        {activeTab === 'accounts' && (
          <div className="search-accounts-tab-list">
            <div className="search-tab-summary">
              Найдено людей и аккаунтов: <strong>{filteredUsers.length}</strong>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="search-empty-large">
                <UserIcon size={48} className="empty-icon" />
                <h3>Пользователи не найдены</h3>
                <p>По запросу «{query}» не найдено зарегистрированных профилей.</p>
              </div>
            ) : (
              <div className="accounts-list-rows">
                {filteredUsers.map(user => {
                  const isSubscribed = followingIds.includes(user.id);
                  const isMe = user.id === currentUser?.id;
                  return (
                    <div 
                      key={user.id} 
                      className="account-row-item"
                      onClick={() => navigate(user.username ? `/profile/@${user.username}` : `/profile/${user.id}`)}
                    >
                      <div className="account-row-avatar-wrap">
                        <img src={user.avatar} alt={user.name} className="account-row-avatar" />
                        {user.online && <span className="account-row-online-badge" />}
                      </div>

                      <div className="account-row-main-info">
                        <div className="account-row-names">
                          <span className="account-row-fullname">{user.name}</span>
                          <span className="account-row-handle">@{user.username}</span>
                          {user.role === 'critic' && (
                            <span className="account-role-tag critic">
                              <Flame size={12} /> Критик
                            </span>
                          )}
                        </div>
                        {user.bio && <p className="account-row-bio">{user.bio}</p>}
                        <div className="account-row-stats-line">
                          <span>{user.followersCount || 1} подписчиков</span>
                          <span>•</span>
                          <span>{user.postsCount || 0} публикаций</span>
                        </div>
                      </div>

                      {!isMe && (
                        <button
                          type="button"
                          className={`account-row-btn ${isSubscribed ? 'active-following' : 'primary-follow'}`}
                          onClick={(e) => handleToggleFollow(user.id, e)}
                        >
                          {isSubscribed ? (
                            <>
                              <Check size={15} />
                              <span>Подписки</span>
                            </>
                          ) : (
                            <>
                              <UserPlus size={15} />
                              <span>Подписаться</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: VIDEOS --- */}
        {activeTab === 'videos' && (
          <div className="search-videos-tab-list">
            <div className="search-tab-summary">
              Найдено видеороликов: <strong>{filteredVideos.length}</strong>
            </div>
            {filteredVideos.length === 0 ? (
              <div className="search-empty-large">
                <VideoIcon size={48} className="empty-icon" />
                <h3>Видео не найдены</h3>
                <p>По запросу «{query}» подходящих видеороликов нет.</p>
              </div>
            ) : (
              <div className="search-videos-grid-expanded">
                {filteredVideos.map(video => (
                  <div 
                    key={video.id} 
                    className="search-video-card"
                    onClick={() => navigate('/video')}
                  >
                    <div className="search-video-thumb-box">
                      <img src={video.thumbnail} alt={video.title} className="search-video-img" />
                      <span className="search-video-duration">{video.duration}</span>
                      <div className="search-video-play-hint">
                        <Play size={24} fill="white" />
                      </div>
                    </div>
                    <div className="search-video-info">
                      <h4 className="search-video-title">{video.title}</h4>
                      <p className="search-video-desc-line">{video.description}</p>
                      <div className="search-video-author">
                        <img src={video.channel.avatar} alt={video.channel.name} className="search-video-channel-avatar" />
                        <span>{video.channel.name}</span>
                      </div>
                      <div className="search-video-meta">
                        <span>{video.views}</span> • <span>{video.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB: PUBLICATIONS (Instagram 3-Column Grid) --- */}
        {activeTab === 'posts' && (
          <div className="search-posts-tab-list">
            <div className="search-tab-summary">
              Найдено публикаций: <strong>{filteredPosts.length}</strong>
            </div>
            {filteredPosts.length === 0 ? (
              <div className="search-empty-large">
                <ImageIcon size={48} className="empty-icon" />
                <h3>Публикации не найдены</h3>
                <p>Попробуйте ввести другие ключевые слова или теги.</p>
              </div>
            ) : (
              <div className="explore-media-grid">
                {filteredPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="explore-media-item"
                    onClick={() => setSelectedPost(post)}
                  >
                    <img src={post.image} alt={post.caption} className="explore-media-thumb" />
                    
                    {/* Instagram Hover Stats Overlay */}
                    <div className="explore-hover-overlay">
                      <div className="explore-hover-stat">
                        <Heart size={18} fill="white" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="explore-hover-stat">
                        <MessageCircle size={18} fill="white" />
                        <span>{post.comments.length}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Interactive Instagram-Style Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLikePost={(_id) => {
            setSelectedPost(prev => prev ? {
              ...prev,
              liked: !prev.liked,
              likes: prev.liked ? prev.likes - 1 : prev.likes + 1
            } : null);
          }}
          onUpdatePost={(updated) => setSelectedPost(updated)}
        />
      )}
    </div>
  );
}
