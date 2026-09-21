import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Image as ImageIcon, Video, Headphones, Sparkles, LogIn, ArrowRight, ShieldCheck, LifeBuoy } from 'lucide-react';
import { StoriesBar } from '../components/StoriesBar';
import { PostCard } from '../components/PostCard';
import { PostDetailModal } from '../components/PostDetailModal';
import { CreatePostModal } from '../components/CreatePostModal';
import { AuthModal } from '../components/AuthModal';
import { type Post, type Story } from '../data/mock';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { cacheService } from '../utils/cacheService';
import { syncLocalStoriesWithServer } from '../utils/syncStories';
import { getStoredFollowingIds, isUserFollowed, toggleUserFollow, getAllUsersPool } from '../utils/followStorage';
import './FeedPage.css';

export function FeedPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, allAccounts } = useAuth();
  const [feedPosts, setFeedPosts] = useState<Post[]>(() => {
    return cacheService.get<Post[]>('feed_posts_cache') || [];
  });
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const response = await api.posts.list();
        const data = response.data || response;
        if (Array.isArray(data)) {
          setFeedPosts(data);
          cacheService.set('feed_posts_cache', data, 3600 * 24, 'feed');
        }
      } catch (err) {
        console.warn('Не удалось загрузить ленту:', err);
      } finally {
        setFeedLoading(false);
      }
    };
    const loadStories = async () => {
      try {
        const stories = await syncLocalStoriesWithServer();
        if (Array.isArray(stories) && stories.length > 0) {
          setFeedStories(stories);
          cacheService.set('feed_stories_cache', stories, 3600 * 24, 'stories');
        } else if (api.stories && api.stories.list) {
          const res = await api.stories.list();
          const data = res.data || res;
          if (Array.isArray(data)) {
            setFeedStories(data);
            cacheService.set('feed_stories_cache', data, 3600 * 24, 'stories');
          }
        }
      } catch (err) {
        console.warn('Ошибка загрузки историй:', err);
      }
    };
    loadFeed();
    loadStories();

    const handleFocus = () => {
      loadStories();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const handlePostCreated = (e: any) => {
      const p = e.detail;
      if (p && (p.id || p.caption)) {
        setFeedPosts(prev => {
          if (prev.some(existing => existing.id === p.id)) return prev;
          const updated = [p, ...prev];
          cacheService.set('feed_posts_cache', updated, 3600 * 24, 'feed');
          return updated;
        });
      }
    };
    window.addEventListener('post_created', handlePostCreated);
    return () => window.removeEventListener('post_created', handlePostCreated);
  }, []);

  useEffect(() => {
    const handlePostDeleted = (e: any) => {
      const deletedId = e.detail?.postId;
      if (deletedId) {
        setFeedPosts(prev => {
          const updated = prev.filter(p => p.id !== deletedId);
          cacheService.set('feed_posts_cache', updated, 3600 * 24, 'feed');
          return updated;
        });
        setSelectedPost(null);
      }
    };
    window.addEventListener('post_deleted', handlePostDeleted);
    return () => window.removeEventListener('post_deleted', handlePostDeleted);
  }, []);

  useEffect(() => {
    const handleStoryCreated = (e: any) => {
      const s = e.detail;
      if (s && s.id) {
        setFeedStories(prev => {
          if (prev.some(existing => existing.id === s.id)) return prev;
          const updated = [s, ...prev];
          cacheService.set('feed_stories_cache', updated, 3600 * 24, 'stories');
          return updated;
        });
      }
    };
    window.addEventListener('story_created', handleStoryCreated);
    return () => window.removeEventListener('story_created', handleStoryCreated);
  }, []);

  const [feedStories, setFeedStories] = useState<Story[]>(() => {
    return cacheService.get<Story[]>('feed_stories_cache') || [];
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>(() => getStoredFollowingIds(currentUser?.id));

  useEffect(() => {
    const handleFollowChange = () => {
      setFollowingIds(getStoredFollowingIds(currentUser?.id));
    };
    window.addEventListener('follow_change', handleFollowChange);
    return () => window.removeEventListener('follow_change', handleFollowChange);
  }, [currentUser?.id]);

  const handleAddStory = (newStory: Story) => {
    setFeedStories(prev => {
      const updated = [newStory, ...prev];
      cacheService.set('feed_stories_cache', updated, 3600 * 24, 'stories');
      return updated;
    });
  };

  const handleDeleteStory = (storyId: string) => {
    setFeedStories(prev => {
      const updated = prev.filter(s => s.id !== storyId);
      cacheService.set('feed_stories_cache', updated, 3600 * 24, 'stories');
      return updated;
    });
  };

  const handleCreatePost = (newPost: Post) => {
    setFeedPosts(prev => {
      const updated = [newPost, ...prev];
      cacheService.set('feed_posts_cache', updated, 3600 * 24, 'feed');
      return updated;
    });
  };

  const handleLike = (postId: string) => {
    setFeedPosts(prev => {
      const updated = prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      );
      cacheService.set('feed_posts_cache', updated, 3600 * 24, 'feed');
      return updated;
    });
  };

  const toggleFollow = (userId: string) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    toggleUserFollow(userId, currentUser?.id);
    setFollowingIds(getStoredFollowingIds(currentUser?.id));
  };

  const [feedTab, setFeedTab] = useState<'for_you' | 'following' | 'popular' | 'tech'>('for_you');

  // Recommendations list (users not yet followed)
  const recommendations = useMemo(() => {
    const pool = getAllUsersPool(currentUser, allAccounts);
    const myId = currentUser?.id || 'guest';
    const myCleanUsername = (currentUser?.username || '').replace(/^@+/, '').toLowerCase();

    return pool
      .filter(u => {
        if (!u.id || u.id === myId || u.id === 'guest' || u.id === 'me') return false;
        const cleanU = (u.username || '').replace(/^@+/, '').toLowerCase();
        if (cleanU === myCleanUsername) return false;
        return !isUserFollowed(u.id, currentUser?.id) && !isUserFollowed(u.username, currentUser?.id);
      })
      .slice(0, 5)
      .map(u => ({
        id: u.id,
        name: u.name || u.username,
        username: (u.username || '').replace(/^@+/, ''),
        avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      }));
  }, [currentUser, allAccounts, followingIds]);

  const filteredPosts = useMemo<Post[]>(() => {
    if (feedTab === 'following') {
      return feedPosts.filter(p => {
        if (!p.user || p.user.id === currentUser?.id || p.user.id === 'me') return false;
        return isUserFollowed(p.user.id, currentUser?.id) || 
               isUserFollowed(p.user.username, currentUser?.id) ||
               ((p as any).userID && isUserFollowed((p as any).userID, currentUser?.id));
      });
    }
    if (feedTab === 'popular') {
      return [...feedPosts].sort((a, b) => b.likes - a.likes);
    }
    if (feedTab === 'tech') {
      return feedPosts.filter(p => p.caption.toLowerCase().includes('код') || p.caption.toLowerCase().includes('react') || p.caption.toLowerCase().includes('go') || p.caption.toLowerCase().includes('демо'));
    }
    return feedPosts;
  }, [feedPosts, feedTab, followingIds, currentUser?.id]);

  return (
    <div className="feed-page-layout">
      {/* Main Feed Column */}
      <div className="feed-main-col">
        <StoriesBar stories={feedStories} onAddStory={handleAddStory} onDeleteStory={handleDeleteStory} />

        {/* Official Motto Banner */}
        <div className="feed-motto-banner">
          <div className="motto-badge-icon">
            <LifeBuoy size={18} className="motto-icon" />
          </div>
          <div className="motto-text-content">
            <span className="motto-quote">«Спасение служба»</span>
            <span className="motto-sub">Официальный девиз платформы • Помощь, взаимная поддержка и безопасность каждого участника</span>
          </div>
          <div className="motto-shield-pill">
            <ShieldCheck size={14} /> <span>Экосистема доверия</span>
          </div>
        </div>

        {/* Create Post Input Bar or Guest Welcome Banner */}
        {isAuthenticated ? (
          <div className="feed-create-post-card">
            <div className="create-post-trigger-top" onClick={() => setIsCreatePostOpen(true)}>
              <img src={currentUser.avatar} alt={currentUser.name} className="create-my-avatar" />
              <div className="create-post-fake-input">
                Что у вас нового, {currentUser.name.split(' ')[0]}? Опубликовать новость...
              </div>
            </div>
            <div className="create-post-quick-actions">
              <button className="quick-post-action" onClick={() => setIsCreatePostOpen(true)}>
                <ImageIcon size={17} color="#10B981" /> <span>Фото / Новость</span>
              </button>
              <button className="quick-post-action" onClick={() => navigate('/video')}>
                <Video size={17} color="#EF4444" /> <span>Видео</span>
              </button>
              <button className="quick-post-action" onClick={() => navigate('/podcasts')}>
                <Headphones size={17} color="var(--color-accent)" /> <span>Подкаст</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="feed-guest-welcome-card">
            <div className="guest-welcome-content">
              <div className="guest-welcome-badge">
                <Sparkles size={14} /> NEW AGE ЭКОСИСТЕМА
              </div>
              <h3>Добро пожаловать в единое пространство контента</h3>
              <p>Создайте аккаунт или войдите, чтобы публиковать статьи, делиться видео, общаться в мессенджере и открывать сообщества.</p>
              <div className="guest-welcome-actions">
                <button className="guest-primary-btn" onClick={() => setAuthModalOpen(true)}>
                  <LogIn size={16} /> Создать аккаунт или войти
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feed Category Tabs */}
        <div className="feed-category-tabs">
          <button 
            className={`feed-tab-pill ${feedTab === 'for_you' ? 'active' : ''}`}
            onClick={() => setFeedTab('for_you')}
          >
            🔥 <span>Для вас</span>
          </button>
          <button 
            className={`feed-tab-pill ${feedTab === 'following' ? 'active' : ''}`}
            onClick={() => setFeedTab('following')}
          >
            👥 <span>Подписки</span>
          </button>
          <button 
            className={`feed-tab-pill ${feedTab === 'popular' ? 'active' : ''}`}
            onClick={() => setFeedTab('popular')}
          >
            ⚡ <span>Популярное</span>
          </button>
          <button 
            className={`feed-tab-pill ${feedTab === 'tech' ? 'active' : ''}`}
            onClick={() => setFeedTab('tech')}
          >
            💻 <span>Технологии</span>
          </button>
        </div>

        <div className="feed-posts-list">
          {feedLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              Загрузка...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-text-secondary)', background: 'var(--color-bg-card)', borderRadius: '16px', margin: '1rem 0' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                {feedTab === 'following' ? 'У вас пока нет публикаций в подписках' : 'Публикаций пока нет'}
              </p>
              <p style={{ fontSize: '14px', margin: 0 }}>
                {feedTab === 'following' ? 'Подпишитесь на авторов в блоке рекомендаций справа, чтобы видеть их публикации здесь.' : 'Будьте первым, кто создаст публикацию!'}
              </p>
            </div>
          ) : (
            filteredPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLike={handleLike}
                onOpenModal={setSelectedPost}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar (Recommendations & Trends) */}
      <aside className="feed-side-col">
        {/* Current User Hero Card or Guest Join Card */}
        {isAuthenticated ? (
          <div 
            className="feed-current-user-card"
            onClick={() => navigate(currentUser.username ? `/profile/@${currentUser.username}` : `/profile/${currentUser.id}`)}
          >
            <div 
              className="feed-user-hero-cover" 
              style={{ backgroundImage: `url(${currentUser.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'})` }} 
            />
            <div className="feed-user-hero-body">
              <div className="feed-user-avatar-wrap">
                <img src={currentUser.avatar} alt={currentUser.name} className="feed-my-avatar" />
                <span className="feed-avatar-online-pip" />
              </div>
              <div className="feed-my-meta">
                <span className="feed-my-name">{currentUser.name}</span>
                <span className="feed-my-handle">@{currentUser.username}</span>
              </div>
              <div className="feed-user-stats-strip">
                <div className="hero-stat-item">
                  <strong>{currentUser.postsCount || 24}</strong>
                  <span>постов</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat-item">
                  <strong>14.2K</strong>
                  <span>подписчиков</span>
                </div>
                <div className="hero-stat-divider" />
                <div className="hero-stat-item">
                  <strong>{currentUser.followingCount || 382}</strong>
                  <span>подписок</span>
                </div>
              </div>
              <button className="feed-switch-btn">Мой профиль</button>
            </div>
          </div>
        ) : (
          <div className="feed-guest-join-card">
            <div className="guest-join-header">
              <div className="guest-join-icon-box">
                <Sparkles size={20} color="#6366F1" />
              </div>
              <h4>Присоединяйтесь к New Age</h4>
            </div>
            <p className="guest-join-desc">
              Общайтесь, создавайте закрытые конференции, запускайте подкасты и торгуйте на маркетплейсе без ограничений.
            </p>
            <button className="guest-join-cta-btn" onClick={() => setAuthModalOpen(true)}>
              <span>Создать профиль</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

        {/* Recommendations */}
        <div className="feed-recommendations-box">
          <div className="box-header">
            <span className="box-title">Рекомендации для вас</span>
            <span 
              className="box-all-btn" 
              onClick={() => {
                if (!isAuthenticated) {
                  setAuthModalOpen(true);
                } else {
                  navigate('/conferences');
                }
              }}
            >
              Конференция
            </span>
          </div>

          <div className="recommendations-list">
            {recommendations.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                Вы подписаны на всех предложенных авторов!
              </div>
            ) : (
              recommendations.map(u => {
                const isFollowed = isUserFollowed(u.id, currentUser?.id);
                return (
                  <div key={u.id} className="rec-user-row">
                    <img 
                      src={u.avatar} 
                      alt={u.name} 
                      className="rec-avatar"
                      onClick={() => navigate(`/profile/${u.id}`)}
                    />
                    <div 
                      className="rec-info"
                      onClick={() => navigate(`/profile/${u.id}`)}
                    >
                      <span className="rec-name">{u.name}</span>
                      <span className="rec-handle">@{u.username}</span>
                    </div>
                    <button
                      className={`rec-follow-btn ${isFollowed ? 'followed' : ''}`}
                      onClick={() => toggleFollow(u.id)}
                    >
                      {isFollowed ? 'Подписки' : 'Подписаться'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Daily Horoscope Mini-Widget */}
        <div 
          className="feed-horoscope-widget-box"
          onClick={() => navigate('/spiritual/horoscope')}
          title="Открыть полный гороскоп на каждый день"
        >
          <div className="horoscope-widget-header">
            <div className="horoscope-widget-badge">
              <Sparkles size={13} />
              <span>ГОРОСКОП НА СЕГОДНЯ</span>
            </div>
            <span className="horoscope-widget-arrow">Подробнее →</span>
          </div>
          <div className="horoscope-widget-body">
            <div className="horoscope-widget-sign-symbol">♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓</div>
            <h4 className="horoscope-widget-title">Астропрогноз день-в-день</h4>
            <p className="horoscope-widget-snippet">
              Узнайте, что вас ожидает сегодня: персональный расчет по дню, месяцу и году рождения для всех 12 знаков.
            </p>
            <div className="horoscope-widget-tags">
              <span>Любовь</span>
              <span>Карьера</span>
              <span>Здоровье</span>
              <span>Совет дня</span>
            </div>
          </div>
        </div>

        {/* Trends Box */}
        <div className="feed-trends-box">
          <div className="box-header">
            <span className="box-title"><TrendingUp size={15} /> Актуальные темы</span>
          </div>
          <div className="trends-list">
            <div className="trend-item" onClick={() => navigate('/video')}>
              <span className="trend-tag">#React19</span>
              <span className="trend-count">48.2K публикаций</span>
            </div>
            <div className="trend-item" onClick={() => navigate('/video')}>
              <span className="trend-tag">#GoLang126</span>
              <span className="trend-count">32.1K публикаций</span>
            </div>
            <div className="trend-item" onClick={() => navigate('/podcasts')}>
              <span className="trend-tag">#ДизайнИнтерфейсов</span>
              <span className="trend-count">19.5K публикаций</span>
            </div>
          </div>
        </div>

        {/* Mini Footer */}
        <div className="feed-mini-footer">
          <p>© 2026 ДЕМО Социальная сеть</p>
          <p>Светлый интерфейс · React 19 + Go</p>
        </div>
      </aside>

      {/* Post Details Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLikePost={handleLike}
          onUpdatePost={(updated) => {
            setSelectedPost(updated);
            setFeedPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
          }}
          onDeletePost={(postId) => {
            setFeedPosts(prev => {
              const updated = prev.filter(p => p.id !== postId);
              cacheService.set('feed_posts_cache', updated, 3600 * 24, 'feed');
              return updated;
            });
            setSelectedPost(null);
          }}
        />
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onCreatePost={handleCreatePost}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
