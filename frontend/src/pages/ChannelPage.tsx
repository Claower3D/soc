import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Tv, Video, Play, Upload, Bell, Check, Share2, 
  Settings, Trash2, MessageSquare, ThumbsUp, 
  ExternalLink, Calendar, Eye, ShieldCheck, Sparkles
} from 'lucide-react';
import { UploadVideoModal } from '../components/UploadVideoModal';
import { EditChannelModal } from '../components/EditChannelModal';
import { 
  currentUser, initialUsers, videos as initialVideos, 
  type User, type Video as VideoType 
} from '../data/mock';
import './ChannelPage.css';

interface CommunityPost {
  id: string;
  author: User;
  text: string;
  image?: string;
  date: string;
  likes: number;
  liked: boolean;
  commentsCount: number;
}

const initialCommunityPosts: CommunityPost[] = [
  {
    id: 'cp1',
    author: currentUser,
    text: 'Привет всем подписчикам канала! 🚀 Готовим большой выпуск по разбору архитектуры React 19 + Go 1.26 с реальным стримингом видео и WebRTC конференциями. О каких темах рассказать подробнее?',
    date: 'Вчера в 14:20',
    likes: 142,
    liked: false,
    commentsCount: 18,
  },
  {
    id: 'cp2',
    author: currentUser,
    text: 'Превью нашего нового дизайна в светлых тонах ✨ Оцените скриншот интерфейса плеера и чатов!',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80',
    date: '3 дня назад',
    likes: 284,
    liked: true,
    commentsCount: 34,
  },
];

const playlists = [
  {
    id: 'pl1',
    title: 'Fullstack разработка: React 19 + Go',
    count: 8,
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    updatedAt: 'Обновлен на этой неделе',
  },
  {
    id: 'pl2',
    title: 'UI/UX дизайн и светлые интерфейсы',
    count: 6,
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
    updatedAt: '2 недели назад',
  },
  {
    id: 'pl3',
    title: 'Записи конференций и спринт-синков',
    count: 4,
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    updatedAt: 'Вчера',
  },
];

export function ChannelPage() {
  const { channelId } = useParams();
  const navigate = useNavigate();

  const isMe = !channelId || channelId === 'me' || channelId === currentUser.id;

  const channelUser: User = useMemo(() => {
    if (isMe) return currentUser;
    const found = initialUsers.find(u => u.id === channelId || u.username === channelId);
    return found || initialUsers[2];
  }, [isMe, channelId]);

  const [activeTab, setActiveTab] = useState<'home' | 'videos' | 'playlists' | 'community' | 'about'>('home');
  const [channelVideos, setChannelVideos] = useState<VideoType[]>(() => {
    if (isMe) {
      return initialVideos;
    }
    return initialVideos.filter(v => v.channel.id === channelUser.id || v.channel.name === channelUser.name);
  });
  const [videoSort, setVideoSort] = useState<'newest' | 'popular'>('newest');
  const [isSubscribed, setIsSubscribed] = useState(channelUser.isFollowed ?? false);
  const [subsCount, setSubsCount] = useState(channelUser.followersCount || 14200);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [channelInfo, setChannelInfo] = useState({
    title: channelUser.name,
    handle: channelUser.username,
    bio: channelUser.bio || 'Официальный видеоканал: уроки по программированию, стримы и обзоры технологий.',
    website: channelUser.website || 'https://github.com/alex-demo',
    banner: channelUser.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80',
    avatar: channelUser.avatar,
  });
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(initialCommunityPosts);
  const [newCommunityText, setNewCommunityText] = useState('');

  const featuredVideo = channelVideos[0];

  const sortedVideos = useMemo(() => {
    const list = [...channelVideos];
    if (videoSort === 'popular') {
      return list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }
    return list;
  }, [channelVideos, videoSort]);

  const handleToggleSubscribe = () => {
    if (isSubscribed) {
      setIsSubscribed(false);
      setSubsCount(s => Math.max(0, s - 1));
    } else {
      setIsSubscribed(true);
      setSubsCount(s => s + 1);
    }
  };

  const handleShareChannel = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleUploadVideo = (newVideo: VideoType) => {
    setChannelVideos(prev => [newVideo, ...prev]);
    initialVideos.unshift(newVideo);
  };

  const handleDeleteVideo = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChannelVideos(prev => prev.filter(v => v.id !== videoId));
  };

  const handleAddCommunityPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityText.trim()) return;

    const newPost: CommunityPost = {
      id: `cp_${Date.now()}`,
      author: currentUser,
      text: newCommunityText.trim(),
      date: 'Только что',
      likes: 1,
      liked: true,
      commentsCount: 0,
    };

    setCommunityPosts(prev => [newPost, ...prev]);
    setNewCommunityText('');
  };

  const handleToggleLikeCommunity = (postId: string) => {
    setCommunityPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            liked: !p.liked,
            likes: p.liked ? p.likes - 1 : p.likes + 1,
          };
        }
        return p;
      })
    );
  };

  return (
    <div className="youtube-channel-page">
      {/* Channel Header Banner */}
      <div className="channel-banner-container">
        <img 
          src={channelInfo.banner} 
          alt="Channel Banner" 
          className="channel-banner-img"
        />
        <div className="channel-banner-overlay" />
      </div>

      {/* Channel Author Info Bar */}
      <div className="channel-info-section">
        <div className="channel-info-layout">
          <div className="channel-avatar-box">
            <img src={channelInfo.avatar} alt={channelInfo.title} className="channel-main-avatar" />
            {channelUser.online && <span className="channel-online-pip" title="В сети" />}
          </div>

          <div className="channel-meta-box">
            <div className="channel-name-row">
              <h1 className="channel-title">{channelInfo.title}</h1>
              <span title="Подтвержденный канал" style={{ display: 'inline-flex' }}>
                <ShieldCheck size={20} className="channel-verified-badge" />
              </span>
            </div>

            <div className="channel-sub-details">
              <span className="channel-handle">@{channelInfo.handle}</span>
              <span className="detail-separator">·</span>
              <span className="channel-subs-count">
                <strong>{subsCount.toLocaleString('ru-RU')}</strong> подписчиков
              </span>
              <span className="detail-separator">·</span>
              <span className="channel-vids-count">
                <strong>{channelVideos.length}</strong> видео
              </span>
            </div>

            <p className="channel-bio-line">
              {channelInfo.bio}
            </p>

            {channelInfo.website && (
              <a href={channelInfo.website} target="_blank" rel="noreferrer" className="channel-link-tag">
                <ExternalLink size={13} /> {channelInfo.website.replace('https://', '')}
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="channel-actions-cluster">
            {isMe ? (
              <>
                <button 
                  className="btn-channel-primary"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Upload size={16} />
                  <span>Загрузить видео</span>
                </button>
                <button 
                  className="btn-channel-secondary"
                  onClick={() => setIsEditChannelOpen(true)}
                >
                  <Settings size={16} />
                  <span>Настроить канал</span>
                </button>
                <button 
                  className="btn-channel-icon"
                  onClick={handleShareChannel}
                  title="Поделиться каналом"
                >
                  {copiedLink ? <Check size={18} color="#10B981" /> : <Share2 size={18} />}
                </button>
              </>
            ) : (
              <>
                <button 
                  className={`btn-channel-subscribe ${isSubscribed ? 'subscribed' : ''}`}
                  onClick={handleToggleSubscribe}
                >
                  <Bell size={16} />
                  <span>{isSubscribed ? 'Вы подписаны' : 'Подписаться'}</span>
                </button>
                <button 
                  className="btn-channel-icon"
                  onClick={handleShareChannel}
                  title="Поделиться ссылкой на канал"
                >
                  {copiedLink ? <Check size={18} color="#10B981" /> : <Share2 size={18} />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Channel Navigation Tabs */}
      <div className="channel-tabs-bar">
        <div className="channel-tabs-container">
          <button 
            className={`channel-tab-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Главная
          </button>
          <button 
            className={`channel-tab-link ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            Видео ({channelVideos.length})
          </button>
          <button 
            className={`channel-tab-link ${activeTab === 'playlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('playlists')}
          >
            Плейлисты ({playlists.length})
          </button>
          <button 
            className={`channel-tab-link ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            Сообщество ({communityPosts.length})
          </button>
          <button 
            className={`channel-tab-link ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            О канале
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="channel-body-content">
        {/* ==================== 1. HOME TAB ==================== */}
        {activeTab === 'home' && (
          <div className="tab-home-layout">
            {/* Featured Trailer Video */}
            {featuredVideo && (
              <div className="channel-trailer-card" onClick={() => navigate('/video')}>
                <div className="trailer-preview-box">
                  <img src={featuredVideo.thumbnail} alt={featuredVideo.title} />
                  <span className="trailer-badge">{featuredVideo.duration}</span>
                  <div className="trailer-play-btn">
                    <Play size={28} fill="white" color="white" />
                  </div>
                </div>

                <div className="trailer-info-box">
                  <span className="featured-tag">Главное видео канала</span>
                  <h2 className="trailer-title">{featuredVideo.title}</h2>
                  <div className="trailer-meta">
                    <span>{featuredVideo.views}</span>
                    <span>·</span>
                    <span>{featuredVideo.timeAgo}</span>
                  </div>
                  <p className="trailer-desc">{featuredVideo.description}</p>
                  <button className="btn-watch-trailer" onClick={() => navigate('/video')}>
                    <Play size={16} fill="currentColor" /> Смотреть ролик
                  </button>
                </div>
              </div>
            )}

            {/* Recent Uploads Row */}
            <div className="channel-section-shelf">
              <div className="shelf-header">
                <h3>Недавние видео</h3>
                <span className="shelf-view-all" onClick={() => setActiveTab('videos')}>
                  Смотреть все ({channelVideos.length})
                </span>
              </div>

              <div className="channel-videos-grid">
                {channelVideos.slice(0, 4).map(vid => (
                  <div key={vid.id} className="channel-vid-card" onClick={() => navigate('/video')}>
                    <div className="vid-thumb-wrap">
                      <img src={vid.thumbnail} alt={vid.title} />
                      <span className="vid-duration-tag">{vid.duration}</span>
                    </div>
                    <div className="vid-details-wrap">
                      <h4 className="vid-card-title">{vid.title}</h4>
                      <p className="vid-card-meta">{vid.views} · {vid.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. VIDEOS TAB ==================== */}
        {activeTab === 'videos' && (
          <div className="tab-videos-layout">
            <div className="videos-filter-bar">
              <div className="filter-chips">
                <button 
                  className={`filter-chip ${videoSort === 'newest' ? 'active' : ''}`}
                  onClick={() => setVideoSort('newest')}
                >
                  Сначала новые
                </button>
                <button 
                  className={`filter-chip ${videoSort === 'popular' ? 'active' : ''}`}
                  onClick={() => setVideoSort('popular')}
                >
                  Популярные
                </button>
              </div>

              {isMe && (
                <button className="btn-upload-small" onClick={() => setIsUploadModalOpen(true)}>
                  <Upload size={15} /> Загрузить видео
                </button>
              )}
            </div>

            {sortedVideos.length === 0 ? (
              <div className="channel-empty-tab">
                <Video size={48} />
                <h3>Видео пока нет</h3>
                <p>Загрузите первое видео на свой канал прямо сейчас!</p>
                <button className="btn-channel-primary" onClick={() => setIsUploadModalOpen(true)}>
                  <Upload size={16} /> Загрузить видео
                </button>
              </div>
            ) : (
              <div className="channel-videos-grid">
                {sortedVideos.map(vid => (
                  <div key={vid.id} className="channel-vid-card" onClick={() => navigate('/video')}>
                    <div className="vid-thumb-wrap">
                      <img src={vid.thumbnail} alt={vid.title} />
                      <span className="vid-duration-tag">{vid.duration}</span>

                      {/* Owner Delete Button */}
                      {isMe && (
                        <button 
                          className="vid-delete-owner-btn"
                          onClick={(e) => handleDeleteVideo(vid.id, e)}
                          title="Удалить видео"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="vid-details-wrap">
                      <h4 className="vid-card-title">{vid.title}</h4>
                      <p className="vid-card-meta">{vid.views} · {vid.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== 3. PLAYLISTS TAB ==================== */}
        {activeTab === 'playlists' && (
          <div className="tab-playlists-layout">
            <div className="playlists-grid">
              {playlists.map(pl => (
                <div key={pl.id} className="playlist-card" onClick={() => navigate('/video')}>
                  <div className="playlist-thumb-box">
                    <img src={pl.thumbnail} alt={pl.title} />
                    <div className="playlist-count-overlay">
                      <Tv size={16} />
                      <span>{pl.count} видео</span>
                    </div>
                  </div>
                  <div className="playlist-info-box">
                    <h4>{pl.title}</h4>
                    <span className="playlist-updated">{pl.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 4. COMMUNITY TAB ==================== */}
        {activeTab === 'community' && (
          <div className="tab-community-layout">
            {/* Create Community Post for Owner */}
            {isMe && (
              <form onSubmit={handleAddCommunityPost} className="create-community-box">
                <div className="create-comm-top">
                  <img src={currentUser.avatar} alt="You" className="comm-avatar" />
                  <textarea
                    placeholder="Опубликуйте новость или опрос для подписчиков канала..."
                    value={newCommunityText}
                    onChange={e => setNewCommunityText(e.target.value)}
                    rows={2}
                    className="comm-textarea"
                  />
                </div>
                <div className="create-comm-bottom">
                  <button 
                    type="submit" 
                    className="btn-publish-comm"
                    disabled={!newCommunityText.trim()}
                  >
                    <Sparkles size={15} /> Опубликовать запись
                  </button>
                </div>
              </form>
            )}

            {/* Community Feed */}
            <div className="community-posts-list">
              {communityPosts.map(post => (
                <div key={post.id} className="community-card">
                  <div className="comm-header">
                    <img src={post.author.avatar} alt={post.author.name} className="comm-avatar" />
                    <div className="comm-meta">
                      <strong>{post.author.name}</strong>
                      <span>{post.date}</span>
                    </div>
                  </div>

                  <p className="comm-text">{post.text}</p>

                  {post.image && (
                    <div className="comm-img-box">
                      <img src={post.image} alt="post media" />
                    </div>
                  )}

                  <div className="comm-actions">
                    <button 
                      className={`comm-act-btn ${post.liked ? 'liked' : ''}`}
                      onClick={() => handleToggleLikeCommunity(post.id)}
                    >
                      <ThumbsUp size={16} />
                      <span>{post.likes}</span>
                    </button>
                    <button className="comm-act-btn" onClick={() => navigate('/messenger')}>
                      <MessageSquare size={16} />
                      <span>{post.commentsCount} ответов</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== 5. ABOUT TAB ==================== */}
        {activeTab === 'about' && (
          <div className="tab-about-layout">
            <div className="about-col-left">
              <h3>Описание канала</h3>
              <p className="about-full-desc">
                {channelUser.bio || 'Добро пожаловать на наш канал! Здесь мы регулярно делимся обучающими видеоматериалами, лекциями, разбором архитектуры React и Go, а также проводим интерактивные конференции для разработчиков.'}
              </p>

              <h3>Ссылки</h3>
              <div className="about-links-list">
                {channelUser.website && (
                  <a href={channelUser.website} target="_blank" rel="noreferrer" className="about-link-row">
                    <ExternalLink size={16} />
                    <span>Официальный сайт / GitHub</span>
                  </a>
                )}
                <a href="#telegram" className="about-link-row">
                  <ExternalLink size={16} />
                  <span>Сообщество в Телеграме</span>
                </a>
              </div>
            </div>

            <div className="about-col-right">
              <h3>Статистика канала</h3>
              <div className="stats-box-item">
                <Calendar size={18} />
                <span>Дата регистрации: <strong>12 января 2026 г.</strong></span>
              </div>
              <div className="stats-box-item">
                <Eye size={18} />
                <span>Всего просмотров: <strong>1,420,800</strong></span>
              </div>
              <div className="stats-box-item">
                <Video size={18} />
                <span>Опубликовано видео: <strong>{channelVideos.length}</strong></span>
              </div>
              <div className="stats-box-item">
                <Tv size={18} />
                <span>Страна: <strong>Россия</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Video Modal */}
      <UploadVideoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadVideo={handleUploadVideo}
      />

      {/* Edit Channel Modal */}
      <EditChannelModal
        isOpen={isEditChannelOpen}
        onClose={() => setIsEditChannelOpen(false)}
        channelUser={channelUser}
        onSaveChannel={(updated) => {
          setChannelInfo(updated);
          if (isMe) {
            currentUser.name = updated.title;
            currentUser.username = updated.handle;
            currentUser.bio = updated.bio;
            currentUser.website = updated.website;
            currentUser.coverImage = updated.banner;
            currentUser.avatar = updated.avatar;
          }
        }}
      />
    </div>
  );
}
