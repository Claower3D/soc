import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Grid, Video as VideoIcon, Headphones, Bookmark, 
  MapPin, Link as LinkIcon, MessageCircle, Phone, 
  UserCheck, UserPlus, Share2, Edit3, Heart, MessageSquare,
  CheckCircle2, ChevronRight, Tv
} from 'lucide-react';
import { currentUser, initialUsers, posts, videos, podcasts, type User, type Post } from '../data/mock';
import { FollowersModal } from '../components/FollowersModal';
import { PostDetailModal } from '../components/PostDetailModal';
import { EditProfileModal } from '../components/EditProfileModal';
import './ProfilePage.css';

export function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  // Find user by id or 'me'
  const isMe = !userId || userId === 'me' || userId === currentUser.id;
  
  const user: User = useMemo(() => {
    if (isMe) return currentUser;
    const found = initialUsers.find(u => u.id === userId || u.username === userId);
    return found || initialUsers[1];
  }, [isMe, userId]);

  const [isFollowing, setIsFollowing] = useState(user.isFollowed ?? false);
  const [followersCount, setFollowersCount] = useState(user.followersCount);
  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'podcasts' | 'saved'>('posts');
  const [modalType, setModalType] = useState<'Подписчики' | 'Подписки' | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [localUser, setLocalUser] = useState<User>(currentUser);

  const activeUser = isMe ? localUser : user;

  // Filter user's posts, videos, and podcasts
  const userPosts = useMemo(() => {
    return posts.filter(p => p.user.id === user.id || (isMe && p.user.id === 'me'));
  }, [user.id, isMe]);

  const savedPosts = useMemo(() => {
    return posts.filter(p => p.saved);
  }, []);

  const userVideos = useMemo(() => {
    return videos.filter(v => v.channel.id === user.id || (isMe && v.channel.id === 'me'));
  }, [user.id, isMe]);

  const userPodcasts = useMemo(() => {
    return podcasts.filter(p => p.author.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()));
  }, [user.name]);

  const handleToggleFollow = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount(c => c - 1);
    } else {
      setIsFollowing(true);
      setFollowersCount(c => c + 1);
    }
  };

  const handleSendMessage = () => {
    navigate('/messenger');
  };

  const handleStartCall = () => {
    navigate('/conferences');
  };

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };



  return (
    <div className="profile-page">
      {/* Cover Banner */}
      <div className="profile-cover">
        <img 
          src={activeUser.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'} 
          alt="cover" 
          className="cover-img" 
        />
        <div className="cover-gradient" />
      </div>

      {/* Profile Header Card */}
      <div className="profile-header-container">
        <div className="profile-header-card">
          <div className="profile-top-bar">
            {/* Avatar */}
            <div className="profile-avatar-wrapper">
              <img src={activeUser.avatar} alt={activeUser.name} className="profile-main-avatar" />
              {activeUser.online && <span className="profile-online-indicator" title="В сети" />}
            </div>

            {/* Action Buttons */}
            <div className="profile-actions-bar">
              {isMe ? (
                <>
                  <button className="btn btn-secondary" onClick={() => setIsEditProfileOpen(true)}>
                    <Edit3 size={16} /> Редактировать
                  </button>
                  <button className="btn btn-secondary" onClick={handleShareProfile}>
                    <Share2 size={16} /> {copiedLink ? 'Ссылка скопирована!' : 'Поделиться'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`btn ${isFollowing ? 'btn-following' : 'btn-primary'}`}
                    onClick={handleToggleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck size={16} /> Подписки
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} /> Подписаться
                      </>
                    )}
                  </button>
                  <button className="btn btn-secondary" onClick={handleSendMessage}>
                    <MessageCircle size={16} /> Сообщение
                  </button>
                  <button className="btn btn-secondary" onClick={handleStartCall} title="Начать конференцию">
                    <Phone size={16} /> Позвонить
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="profile-identity">
            <div className="name-row">
              <h1 className="profile-fullname">{activeUser.name}</h1>
              <span title="Подтвержденный профиль"><CheckCircle2 size={18} className="verified-badge" /></span>
              <span className="profile-username">@{activeUser.username}</span>
            </div>

            {activeUser.bio && <p className="profile-bio">{activeUser.bio}</p>}

            <div className="profile-meta-row">
              {activeUser.location && (
                <div className="meta-item">
                  <MapPin size={15} />
                  <span>{activeUser.location}</span>
                </div>
              )}
              {activeUser.website && (
                <a href={activeUser.website} target="_blank" rel="noreferrer" className="meta-item meta-link">
                  <LinkIcon size={15} />
                  <span>{activeUser.website.replace('https://', '')}</span>
                </a>
              )}
            </div>
          </div>

          {/* Statistics Counters */}
          <div className="profile-stats-row">
            <div className="stat-card">
              <span className="stat-number">{userPosts.length || user.postsCount}</span>
              <span className="stat-label">публикаций</span>
            </div>
            <div className="stat-card clickable" onClick={() => setModalType('Подписчики')}>
              <span className="stat-number">{followersCount.toLocaleString('ru-RU')}</span>
              <span className="stat-label">подписчиков</span>
              <ChevronRight size={14} className="stat-arrow" />
            </div>
            <div className="stat-card clickable" onClick={() => setModalType('Подписки')}>
              <span className="stat-number">{user.followingCount.toLocaleString('ru-RU')}</span>
              <span className="stat-label">подписок</span>
              <ChevronRight size={14} className="stat-arrow" />
            </div>
          </div>

          {/* Highlights / Актуальное */}
          {user.highlights && user.highlights.length > 0 && (
            <div className="profile-highlights">
              <div className="highlights-title">Актуальное</div>
              <div className="highlights-scroll">
                {user.highlights.map(h => (
                  <div key={h.id} className="highlight-circle">
                    <div className="highlight-ring">
                      <img src={h.cover} alt={h.title} />
                    </div>
                    <span className="highlight-name">{h.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="profile-tabs-wrapper">
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <Grid size={17} />
            <span>Публикации</span>
            <span className="tab-count">{userPosts.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <VideoIcon size={17} />
            <span>Видео</span>
            <span className="tab-count">{userVideos.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'podcasts' ? 'active' : ''}`}
            onClick={() => setActiveTab('podcasts')}
          >
            <Headphones size={17} />
            <span>Подкасты</span>
            <span className="tab-count">{userPodcasts.length}</span>
          </button>
          {isMe && (
            <button
              className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <Bookmark size={17} />
              <span>Сохранённое</span>
              <span className="tab-count">{savedPosts.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="profile-content-container">
        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          userPosts.length > 0 ? (
            <div className="posts-grid">
              {userPosts.map(post => (
                <div
                  key={post.id}
                  className="grid-post-item"
                  onClick={() => setSelectedPost(post)}
                >
                  <img src={post.image} alt={post.caption} className="grid-post-img" />
                  <div className="grid-post-overlay">
                    <div className="overlay-stat">
                      <Heart size={18} fill="white" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="overlay-stat">
                      <MessageSquare size={18} fill="white" />
                      <span>{post.comments.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-tab-state">
              <Grid size={40} className="empty-icon" />
              <h3>Публикаций пока нет</h3>
              <p>Пользователь еще не поделился своими фото или историями.</p>
            </div>
          )
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div className="profile-videos-tab-wrapper">
            <div 
              className="profile-channel-banner-link" 
              onClick={() => navigate(`/channel/${isMe ? 'me' : user.id}`)}
            >
              <div className="channel-link-left">
                <div className="channel-tv-icon-box">
                  <Tv size={22} />
                </div>
                <div className="channel-link-text">
                  <strong>YouTube канал автора</strong>
                  <span>Смотреть все плейлисты, трейлеры, вкладку сообщества</span>
                </div>
              </div>
              <button className="btn-visit-channel">
                Перейти на канал <ChevronRight size={16} />
              </button>
            </div>

            {userVideos.length > 0 ? (
              <div className="profile-videos-grid">
              {userVideos.map(video => (
                <div
                  key={video.id}
                  className="profile-video-card"
                  onClick={() => navigate('/video')}
                >
                  <div className="video-card-thumb">
                    <img src={video.thumbnail} alt={video.title} />
                    <span className="video-card-duration">{video.duration}</span>
                  </div>
                  <div className="video-card-details">
                    <h4>{video.title}</h4>
                    <p>{video.views} · {video.timeAgo}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-tab-state">
              <VideoIcon size={40} className="empty-icon" />
              <h3>Видео не найдены</h3>
              <p>На этом канале пока нет опубликованных видеоматериалов.</p>
            </div>
          )}
          </div>
        )}

        {/* PODCASTS TAB */}
        {activeTab === 'podcasts' && (
          userPodcasts.length > 0 ? (
            <div className="profile-podcasts-list">
              {userPodcasts.map(pod => (
                <div key={pod.id} className="profile-pod-card" onClick={() => navigate('/podcasts')}>
                  <img src={pod.cover} alt={pod.title} className="pod-card-cover" />
                  <div className="pod-card-info">
                    <h4>{pod.title}</h4>
                    <p>{pod.description}</p>
                    <span className="pod-card-eps">{pod.episodes.length} выпусков</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-tab-state">
              <Headphones size={40} className="empty-icon" />
              <h3>Подкастов нет</h3>
              <p>Пользователь пока не является автором подкастов.</p>
            </div>
          )
        )}

        {/* SAVED TAB */}
        {activeTab === 'saved' && (
          <div className="posts-grid">
            {savedPosts.map(post => (
              <div
                key={post.id}
                className="grid-post-item"
                onClick={() => setSelectedPost(post)}
              >
                <img src={post.image} alt={post.caption} className="grid-post-img" />
                <div className="grid-post-overlay">
                  <div className="overlay-stat">
                    <Heart size={18} fill="white" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="overlay-stat">
                    <MessageSquare size={18} fill="white" />
                    <span>{post.comments.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Followers / Following Modal */}
      {modalType && (
        <FollowersModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={modalType}
          currentUserId={user.id}
        />
      )}

      {/* Interactive Post Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLikePost={(_postId) => {
            setSelectedPost(prev => prev ? {
              ...prev,
              liked: !prev.liked,
              likes: prev.liked ? prev.likes - 1 : prev.likes + 1,
            } : null);
          }}
          onUpdatePost={(updated) => {
            setSelectedPost(updated);
          }}
        />
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={(updated) => {
          setLocalUser({ ...updated });
        }}
      />
    </div>
  );
}
