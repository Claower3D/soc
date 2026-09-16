import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Image as ImageIcon, Video, Headphones, Sparkles, LogIn, ArrowRight, ShieldCheck, LifeBuoy } from 'lucide-react';
import { StoriesBar } from '../components/StoriesBar';
import { PostCard } from '../components/PostCard';
import { PostDetailModal } from '../components/PostDetailModal';
import { CreatePostModal } from '../components/CreatePostModal';
import { AuthModal } from '../components/AuthModal';
import { stories, posts as mockPosts, initialUsers, type Post } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { cacheService } from '../utils/cacheService';
import './FeedPage.css';

export function FeedPage() {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>(() => {
    return cacheService.get<Post[]>('feed_posts_cache') || mockPosts;
  });
  const [feedStories, setFeedStories] = useState(() => {
    return cacheService.get<typeof stories>('feed_stories_cache') || stories;
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({
    '2': false,
    '5': false,
    '7': false,
  });

  const handleAddStory = (newStory: typeof stories[0]) => {
    setFeedStories(prev => {
      const updated = [newStory, ...prev];
      cacheService.set('feed_stories_cache', updated, 3600 * 24, 'stories');
      return updated;
    });
    stories.unshift(newStory);
  };

  const handleCreatePost = (newPost: Post) => {
    setPosts(prev => {
      const updated = [newPost, ...prev];
      cacheService.set('feed_posts_cache', updated, 3600 * 24, 'feed');
      return updated;
    });
    mockPosts.unshift(newPost);
  };

  const handleLike = (postId: string) => {
    setPosts(prev => {
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
    setFollowedMap(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };



  const [feedTab, setFeedTab] = useState<'for_you' | 'following' | 'popular' | 'tech'>('for_you');

  // Recommendations list (users not yet followed)
  const recommendations = initialUsers.filter(u => u.id !== 'me').slice(1, 5);

  const filteredPosts = useMemo<Post[]>(() => {
    if (feedTab === 'following') {
      const followed = posts.filter(p => p.user.id !== 'me' && followedMap[p.user.id]);
      return followed.length > 0 ? followed : posts;
    }
    if (feedTab === 'popular') {
      return [...posts].sort((a, b) => b.likes - a.likes);
    }
    if (feedTab === 'tech') {
      return posts.filter(p => p.caption.toLowerCase().includes('код') || p.caption.toLowerCase().includes('react') || p.caption.toLowerCase().includes('go') || p.caption.toLowerCase().includes('демо'));
    }
    return posts;
  }, [posts, feedTab, followedMap]);

  return (
    <div className="feed-page-layout">
      {/* Main Feed Column */}
      <div className="feed-main-col">
        <StoriesBar stories={feedStories} onAddStory={handleAddStory} />

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
          {filteredPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onLike={handleLike}
              onOpenModal={setSelectedPost}
            />
          ))}
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
            {recommendations.map(u => {
              const isFollowed = followedMap[u.id] ?? false;
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
            })}
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
            setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
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
