import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Image as ImageIcon, Video, Headphones } from 'lucide-react';
import { StoriesBar } from '../components/StoriesBar';
import { PostCard } from '../components/PostCard';
import { PostDetailModal } from '../components/PostDetailModal';
import { CreatePostModal } from '../components/CreatePostModal';
import { stories, posts as mockPosts, initialUsers, currentUser, type Post } from '../data/mock';
import './FeedPage.css';

export function FeedPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({
    '2': false,
    '5': false,
    '7': false,
  });

  const handleCreatePost = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    mockPosts.unshift(newPost);
  };

  const handleLike = (postId: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const toggleFollow = (userId: string) => {
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
        <StoriesBar stories={stories} />

        {/* Create Post Input Bar */}
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
        {/* Current User Hero Card */}
        <div 
          className="feed-current-user-card"
          onClick={() => navigate('/profile/me')}
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

        {/* Recommendations */}
        <div className="feed-recommendations-box">
          <div className="box-header">
            <span className="box-title">Рекомендации для вас</span>
            <span className="box-all-btn" onClick={() => navigate('/conferences')}>Конференция</span>
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
    </div>
  );
}
