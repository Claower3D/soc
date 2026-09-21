import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Grid, Video as VideoIcon, Headphones, Bookmark, 
  MapPin, Link as LinkIcon, MessageCircle, Phone, 
  UserCheck, UserPlus, Share2, Edit3, Heart, MessageSquare,
  CheckCircle2, ChevronRight, Tv, ShoppingBag, Compass, Shield, Flame, LogOut, LogIn, Plus, Brain, Sparkles,
  Calendar, Moon
} from 'lucide-react';
import { 
  RELIGIONS_CATALOG, type User, type Post, type Story, type Video as VideoType, 
  type Podcast, type Product 
} from '../data/mock';
import { api } from '../api';
import { calculateZodiacProfile } from '../utils/astrology';
import { ReligionSymbol } from '../components/ReligionSymbols';
import { useAuth } from '../context/AuthContext';
import { FollowersModal } from '../components/FollowersModal';
import { PostDetailModal } from '../components/PostDetailModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { CreatePostModal } from '../components/CreatePostModal';
import { CreateStoryModal } from '../components/CreateStoryModal';
import { StoriesBar } from '../components/StoriesBar';
import { UploadVideoModal } from '../components/UploadVideoModal';
import { UploadPodcastModal } from '../components/UploadPodcastModal';
import { CreateProductModal } from '../components/CreateProductModal';
import { AuthModal } from '../components/AuthModal';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import { PremiumBadge } from '../components/PremiumBadge';
import { ConsciousnessClassModal } from '../components/ConsciousnessClassModal';
import { useCurrency } from '../context/CurrencyContext';
import { 
  getStoredFollowingIds, 
  isUserFollowed, 
  toggleUserFollow, 
  getFollowersForUser,
  getFollowingForUser,
  getCriticsForUser,
  isUserCritic,
  toggleUserCritic,
  getAllUsersPool 
} from '../utils/followStorage';
import './ProfilePage.css';

export function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout, updateProfile, allAccounts } = useAuth();
  const { formatPrice } = useCurrency();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isUploadVideoOpen, setIsUploadVideoOpen] = useState(false);
  const [isUploadPodcastOpen, setIsUploadPodcastOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [profileStories, setProfileStories] = useState<Story[]>([]);
  const [isViewingStory, setIsViewingStory] = useState(false);
  const [profileVideos, setProfileVideos] = useState<VideoType[]>([]);
  const [profilePodcasts, setProfilePodcasts] = useState<Podcast[]>([]);
  const [profileProducts, setProfileProducts] = useState<Product[]>([]);

  useEffect(() => {
    const safeSet = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>) => (data: any) => {
      if (Array.isArray(data)) setter(data);
    };
    api.posts.list().then(safeSet(setProfilePosts)).catch(console.warn);
    api.stories.list().then(safeSet(setProfileStories)).catch(console.warn);
    api.videos.list().then(safeSet(setProfileVideos)).catch(console.warn);
    api.podcasts.list().then(safeSet(setProfilePodcasts)).catch(console.warn);
    api.marketplace.products().then(safeSet(setProfileProducts)).catch(console.warn);
  }, []);

  const handleDeleteStory = (storyId: string) => {
    setProfileStories(prev => prev.filter(s => s.id !== storyId));
  };

  // Normalize route param (e.g. '@claower' -> 'claower', 'me', or custom ID)
  const cleanParam = userId ? userId.replace(/^@/, '').toLowerCase() : '';

  // Determine if viewing own profile
  const isMe = !userId || 
    userId === 'me' || 
    cleanParam === currentUser.id?.toLowerCase() || 
    (currentUser.username && cleanParam === currentUser.username.toLowerCase());

  // Automatically rewrite /profile/me or legacy /profile to /profile/@username when logged in
  useEffect(() => {
    if ((!userId || userId === 'me') && isAuthenticated && currentUser?.username && currentUser.username !== 'guest') {
      navigate(`/profile/@${currentUser.username}`, { replace: true });
    }
  }, [userId, isAuthenticated, currentUser?.username, navigate]);

  const user: User = useMemo(() => {
    if (isMe) return currentUser;
    if (cleanParam) {
      const fromRegistered = allAccounts.find(
        a => a.id.toLowerCase() === cleanParam || a.username.toLowerCase() === cleanParam
      );
      if (fromRegistered) return fromRegistered as unknown as User;
    }
    return currentUser;
  }, [isMe, cleanParam, currentUser, allAccounts]);

  const [followingIds, setFollowingIds] = useState<string[]>(() => getStoredFollowingIds());
  const [socialRevision, setSocialRevision] = useState(0);
  const isFollowing = useMemo(() => isUserFollowed(user.id), [user.id, followingIds]);

  // Live sync with external follow & critic changes
  useEffect(() => {
    const handleSync = () => {
      setFollowingIds(getStoredFollowingIds());
      setSocialRevision(r => r + 1);
    };
    window.addEventListener('follow_change', handleSync);
    return () => window.removeEventListener('follow_change', handleSync);
  }, []);

  // Dynamic real user lists & counts that exactly match FollowersModal
  const poolUsers = useMemo(() => {
    return getAllUsersPool(currentUser, allAccounts);
  }, [currentUser, allAccounts]);

  const realFollowersList = useMemo(() => {
    return getFollowersForUser(user.id, poolUsers, currentUser?.id);
  }, [user.id, poolUsers, currentUser?.id, socialRevision]);

  const realFollowingList = useMemo(() => {
    return getFollowingForUser(user.id, poolUsers, !!isMe);
  }, [user.id, poolUsers, isMe, socialRevision]);

  const realCriticsList = useMemo(() => {
    return getCriticsForUser(user.id, poolUsers);
  }, [user.id, poolUsers, socialRevision]);

  const isCritic = useMemo(() => {
    if (!currentUser?.id) return false;
    return isUserCritic(user.id, currentUser.id);
  }, [user.id, currentUser?.id, socialRevision]);

  const [profileData, setProfileData] = useState<Partial<User> | null>(null);

  useEffect(() => {
    if (user.id && user.id !== 'guest') {
      api.users.profile(user.id).then((res) => {
        if (res?.user) setProfileData(res.user);
      }).catch(console.warn);
    }
  }, [user.id]);

  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'podcasts' | 'saved' | 'shop'>('posts');
  const [modalType, setModalType] = useState<'Подписчики' | 'Подписки' | 'Критики' | 'Друзья' | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isConsciousnessModalOpen, setIsConsciousnessModalOpen] = useState(false);

  const activeUser = isMe ? currentUser : user;

  const userHasStories = useMemo(() => {
    return profileStories.some(s => 
      s.user.id === activeUser.id || 
      (activeUser.username && s.user.username === activeUser.username) || 
      (isMe && (s.user.id === 'me' || s.user.id === currentUser.id))
    );
  }, [profileStories, activeUser, isMe, currentUser.id]);

  // Filter user's posts, videos, and podcasts
  const userPosts = useMemo(() => {
    return profilePosts.filter(
      p => p.user.id === user.id || 
           (isMe && (p.user.id === 'me' || p.user.id === currentUser.id || p.user.username === currentUser.username))
    );
  }, [profilePosts, user.id, isMe, currentUser]);

  const savedPosts = useMemo(() => {
    return profilePosts.filter(p => p.saved);
  }, [profilePosts]);

  const userVideos = useMemo(() => {
    return profileVideos.filter(v => v.channel.id === user.id || (isMe && (v.channel.id === 'me' || v.channel.id === currentUser.id)));
  }, [profileVideos, user.id, isMe, currentUser]);

  const userPodcasts = useMemo(() => {
    return profilePodcasts.filter(p => 
      p.author.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()) ||
      (isMe && p.author.toLowerCase().includes(currentUser.name.split(' ')[0].toLowerCase()))
    );
  }, [profilePodcasts, user.name, isMe, currentUser]);

  const userProducts = useMemo(() => {
    return profileProducts.filter(p => p.seller.id === user.id || (isMe && (p.seller.id === 'me' || p.seller.id === currentUser.id)));
  }, [profileProducts, user.id, isMe, currentUser]);

  const handleToggleFollow = () => {
    toggleUserFollow(user.id);
    setFollowingIds(getStoredFollowingIds());
  };

  const handleSendMessage = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    navigate('/messenger');
  };

  const handleStartCall = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    navigate('/conferences');
  };

  const handleShareProfile = () => {
    const shareUrl = `${window.location.origin}/profile/@${activeUser.username}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isAuthenticated && isMe) {
    return (
      <div className="profile-page">
        <div className="messenger-guest-lock-container">
          <GuestLockPrompt
            featureName="Личный профиль"
            title="Личный профиль доступен после регистрации"
            description="Зарегистрируйтесь в New Age, чтобы создать свой профиль, установить аватар и обложку, публиковать фото, истории, видео и общаться с друзьями."
            actionText="Войти или зарегистрироваться"
          />
        </div>
      </div>
    );
  }

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
        <div className="profile-header-card profile-instagram-layout">
          
          <div className="profile-top-layout">
            {/* Left Column: Avatar */}
            <div className="profile-avatar-col">
              <div 
                className={`profile-avatar-wrapper ${userHasStories ? 'has-story' : ''}`}
                onClick={() => {
                  if (userHasStories) setIsViewingStory(true);
                }}
                title={userHasStories ? 'Нажмите, чтобы посмотреть историю' : undefined}
              >
                <img src={activeUser.avatar} alt={activeUser.name} className={`profile-main-avatar ${activeUser.isPremium ? 'profile-premium-frame' : ''}`} />
                {activeUser.online && <span className="profile-online-indicator" title="В сети" />}
                {userHasStories && <span className="profile-story-badge-hint">История</span>}
              </div>
            </div>

            {/* Right Column: Info & Stats */}
            <div className="profile-info-col">
              
              {/* Row 1: Name and Badges */}
              <div className="profile-info-header">
                <div className="profile-name-and-badges">
                  <h1 className={`profile-fullname ${activeUser.isPremium ? 'profile-name-premium-glow' : ''}`}>
                    {activeUser.name}
                  </h1>
                  <span title="Подтвержденный профиль"><CheckCircle2 size={18} className="verified-badge" /></span>
                  {activeUser.isPremium && (
                    <span className="profile-premium-tag" title="New Age Premium подписчик">
                      <PremiumBadge size="lg" showText />
                    </span>
                  )}
                </div>

                <div className="username-role-row" style={{ margin: 0 }}>
                  <button 
                    type="button"
                    className="profile-username-pill"
                    onClick={() => {
                      navigator.clipboard?.writeText(`@${activeUser.username}`);
                      alert(`Уникальный ID @${activeUser.username} скопирован в буфер!`);
                    }}
                    title="Уникальный ID пользователя. Нажмите, чтобы скопировать"
                  >
                    @{activeUser.username}
                  </button>

                  {/* Роли пользователя */}
                  {activeUser.role === 'creator' && (
                    <span className="profile-role-badge creator" title="Автор контента">
                      <VideoIcon size={12} /> Автор
                    </span>
                  )}
                  {activeUser.role === 'business' && (
                    <span className="profile-role-badge business" title="Проверенный продавец">
                      <ShoppingBag size={12} /> Магазин {activeUser.businessCategory ? `• ${activeUser.businessCategory}` : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Compact Stats (Instagram style) */}
              <div className="profile-stats-compact">
                <div className="stat-item">
                  <b>{userPosts.length}</b> публикаций
                </div>
                <div className="stat-item clickable" onClick={() => setModalType('Друзья')}>
                  <b>{(profileData as any)?.friendsCount ?? 0}</b> друзей
                </div>
                <div className="stat-item clickable" onClick={() => setModalType('Подписчики')}>
                  <b>{realFollowersList.length.toLocaleString('ru-RU')}</b> подписчиков
                </div>
                <div className="stat-item clickable" onClick={() => setModalType('Подписки')}>
                  <b>{realFollowingList.length.toLocaleString('ru-RU')}</b> подписок
                </div>
                <div className="stat-item">
                  <b>{(profileData as any)?.clipsCount ?? 0}</b> волны
                </div>
                <div className="stat-item clickable critic-stat" onClick={() => setModalType('Критики')} title="Пользователи, следящие за профилем в режиме конструктивной критики">
                  <Flame size={14} className="critic-flame-icon" style={{marginRight: '2px'}} />
                  <b>{realCriticsList.length.toLocaleString('ru-RU')}</b> критиков
                </div>
              </div>

              {/* Row 3: Bio */}
              {activeUser.bio && <p className="profile-bio" style={{ margin: 0 }}>{activeUser.bio}</p>}

              {/* Row 4: Meta Badges (Location, Religion, Class, Zodiac) */}
              <div className="profile-meta-groups compact-meta">
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

                {activeUser.beliefType && activeUser.beliefType !== 'Не указано' && activeUser.beliefType !== 'Не указывать / Личное' && (
                  (isMe || activeUser.beliefPrivacy === 'public' || (activeUser.beliefPrivacy === 'followers' && isFollowing)) && (() => {
                    const religion = RELIGIONS_CATALOG.find(r => r.name === activeUser.beliefType);
                    return (
                      <div 
                        className="meta-item meta-belief" 
                        title={isMe ? `Видимость: ${activeUser.beliefPrivacy === 'private' ? 'Только мне (Скрыто)' : activeUser.beliefPrivacy === 'followers' ? 'Только подписчикам' : 'Публично'}` : 'Мировоззрение'}
                      >
                        {religion ? (
                          <ReligionSymbol id={religion.id} size={18} className="meta-belief-symbol" />
                        ) : (
                          <Compass size={15} />
                        )}
                        <span>{activeUser.beliefType}</span>
                        {religion?.symbolTitle && (
                          <span className="meta-belief-symbol-name">({religion.symbolTitle})</span>
                        )}
                        {isMe && activeUser.beliefPrivacy === 'private' && (
                          <span className="belief-privacy-badge" title="Скрыто от других"><Shield size={11} /></span>
                        )}
                      </div>
                    );
                  })()
                )}

                {activeUser.consciousnessLevel ? (
                  <div 
                    className="meta-item meta-consciousness" 
                    onClick={() => setIsConsciousnessModalOpen(true)}
                    style={{ cursor: 'pointer' }}
                    title="Класс сознания и ведущий язык восприятия человека. Нажмите для подробностей"
                  >
                    <Brain size={15} className="consciousness-icon" />
                    <span className="consciousness-level-badge">{activeUser.consciousnessLevel} класс</span>
                    <span className="consciousness-title-text">
                      {activeUser.consciousnessTitle 
                        ? activeUser.consciousnessTitle.replace(new RegExp(`^${activeUser.consciousnessLevel}\s*класс\s*[-—]*\s*`, 'i'), '')
                        : 'Осознанность'}
                    </span>
                    {activeUser.cognitionVector && (
                      <span className="consciousness-vector-tag">
                        {activeUser.cognitionVector === 'visual_analogies' && '🍏 на яблоках'}
                        {activeUser.cognitionVector === 'exact_sciences' && '📐 логика и факты'}
                        {activeUser.cognitionVector === 'pragmatic' && '⚡ польза и действие'}
                        {activeUser.cognitionVector === 'philosophical' && '📖 смыслы'}
                        {activeUser.cognitionVector === 'spiritual' && '✨ паттерны и единство'}
                      </span>
                    )}
                  </div>
                ) : (
                  isMe && (
                    <button 
                      type="button" 
                      className="meta-item meta-consciousness-empty"
                      onClick={() => setIsConsciousnessModalOpen(true)}
                      title="Пройти диагностику класса сознания и определить свой язык общения"
                    >
                      <Brain size={15} />
                      <span>Определить класс сознания</span>
                      <Sparkles size={12} className="meta-sparkle" />
                    </button>
                  )
                )}

                {activeUser.birthDate && (isMe || activeUser.showBirthDate !== false) && (() => {
                  const astro = calculateZodiacProfile(activeUser.birthDate);
                  const dateObj = new Date(activeUser.birthDate);
                  const formattedDate = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
                  return (
                    <div className="meta-item meta-birthdate" title="Дата рождения и возраст">
                      <Calendar size={15} />
                      <span>{formattedDate} {astro ? `(${astro.age} лет)` : ''}</span>
                    </div>
                  );
                })()}

                {activeUser.birthDate && (isMe || activeUser.showZodiac !== false) && (() => {
                  const astro = calculateZodiacProfile(activeUser.birthDate);
                  if (!astro) return null;
                  return (
                    <div 
                      className="meta-item meta-zodiac" 
                      title={`Стихия: ${astro.element}, Планета: ${astro.planet}. Восточный знак: ${astro.easternElement} ${astro.easternSign}`}
                    >
                      <Moon size={15} className="zodiac-icon-spin" />
                      <span className="zodiac-sign-bold">{astro.sign}</span>
                      <span className="zodiac-element-pill">{astro.element}</span>
                      <span className="zodiac-eastern-pill">{astro.easternSign}</span>
                    </div>
                  );
                })()}
              </div>
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

          {/* Bottom Row: Action Buttons (full width) */}
          <div className="profile-actions-bottom-row">
            {isMe ? (
              isAuthenticated ? (
                <>
                  <button className="btn btn-primary" onClick={() => setIsCreatePostOpen(true)}>
                    <Plus size={16} /> Опубликовать
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsCreateStoryOpen(true)}>
                    <Plus size={16} /> Добавить историю
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsEditProfileOpen(true)}>
                    <Edit3 size={16} /> Редактировать профиль
                  </button>
                  <button className="btn btn-secondary" onClick={handleShareProfile}>
                    <Share2 size={16} /> {copiedLink ? 'Ссылка скопирована!' : 'Поделиться'}
                  </button>
                  <button 
                    className="btn btn-secondary btn-logout" 
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    title="Выйти из аккаунта"
                  >
                    <LogOut size={16} /> Выйти
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => setAuthModalOpen(true)}>
                    <LogIn size={16} /> Войти в аккаунт
                  </button>
                  <button className="btn btn-secondary" onClick={handleShareProfile}>
                    <Share2 size={16} /> Поделиться
                  </button>
                </>
              )
            ) : (
              <>
                <button
                  className={`btn ${isFollowing ? 'btn-following' : 'btn-primary'}`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthModalOpen(true);
                      return;
                    }
                    handleToggleFollow();
                  }}
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

                <button
                  className={`btn btn-critic-toggle ${isCritic ? 'active' : ''}`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthModalOpen(true);
                      return;
                    }
                    if (currentUser?.id) {
                      toggleUserCritic(user.id, currentUser.id);
                    }
                  }}
                  title="Стать критиком (следить с акцентом на разбор и рецензии)"
                >
                  <Flame size={15} /> {isCritic ? 'В критиках' : 'Стать критиком'}
                </button>

                <button className="btn btn-secondary" onClick={() => {
                  if (!isAuthenticated) {
                    setAuthModalOpen(true);
                    return;
                  }
                  handleSendMessage();
                }}>
                  <MessageCircle size={16} /> Написать
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  if (!isAuthenticated) {
                    setAuthModalOpen(true);
                    return;
                  }
                  handleStartCall();
                }} title="Начать видеозвонок">
                  <Phone size={16} /> Позвонить
                </button>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Tabs Navigation with Direct "Add" Button for the Active Category */}
      <div className="profile-tabs-wrapper">
        <div className="profile-tabs-header-row">
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
            {(activeUser.role === 'business' || userProducts.length > 0 || isMe) && (
              <button
                className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`}
                onClick={() => setActiveTab('shop')}
              >
                <ShoppingBag size={17} />
                <span>Товары & Магазин</span>
                <span className="tab-count">{userProducts.length}</span>
              </button>
            )}
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

          {/* Dedicated Category Add Action for Own Profile */}
          {isMe && (
            <div className="profile-tab-add-action-box">
              {activeTab === 'posts' && (
                <button 
                  className="btn-tab-add-content"
                  onClick={() => setIsCreatePostOpen(true)}
                  title="Опубликовать новую запись или фото"
                >
                  <Plus size={16} />
                  <span>Добавить публикацию</span>
                </button>
              )}

              {activeTab === 'videos' && (
                <button 
                  className="btn-tab-add-content"
                  onClick={() => setIsUploadVideoOpen(true)}
                  title="Загрузить видео на свой канал"
                >
                  <Plus size={16} />
                  <span>Добавить видео</span>
                </button>
              )}

              {activeTab === 'podcasts' && (
                <button 
                  className="btn-tab-add-content"
                  onClick={() => setIsUploadPodcastOpen(true)}
                  title="Опубликовать новый подкаст или аудиовыпуск"
                >
                  <Plus size={16} />
                  <span>Добавить подкаст</span>
                </button>
              )}

              {activeTab === 'shop' && (
                <button 
                  className="btn-tab-add-content"
                  onClick={() => setIsCreateProductOpen(true)}
                  title="Выставить новый товар на продажу"
                >
                  <Plus size={16} />
                  <span>Добавить товар</span>
                </button>
              )}

              {activeTab === 'saved' && (
                <button 
                  className="btn-tab-add-content btn-tab-add-secondary"
                  onClick={() => navigate('/')}
                  title="Перейти в ленту, чтобы найти и сохранить интересные посты"
                >
                  <Compass size={16} />
                  <span>Найти в ленте</span>
                </button>
              )}
            </div>
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
              <p>{isMe ? 'Поделитесь с аудиторией своими фото, мыслями или историями.' : 'Пользователь еще не поделился своими фото или историями.'}</p>
              {isMe && (
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '1rem' }} 
                  onClick={() => setIsCreatePostOpen(true)}
                >
                  <Plus size={16} /> Опубликовать первый пост
                </button>
              )}
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
              <p>{isMe ? 'Загрузите первое видео на свой канал или делитесь трансляциями.' : 'На этом канале пока нет опубликованных видеоматериалов.'}</p>
              {isMe && (
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '1rem' }} 
                  onClick={() => setIsUploadVideoOpen(true)}
                >
                  <Plus size={16} /> Загрузить видео
                </button>
              )}
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
              <p>{isMe ? 'Запишите или загрузите аудиовыпуск своего авторского подкаста.' : 'Пользователь пока не является автором подкастов.'}</p>
              {isMe && (
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '1rem' }} 
                  onClick={() => setIsUploadPodcastOpen(true)}
                >
                  <Plus size={16} /> Опубликовать подкаст
                </button>
              )}
            </div>
          )
        )}

        {/* SAVED TAB */}
        {activeTab === 'saved' && (
          savedPosts.length > 0 ? (
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
          ) : (
            <div className="empty-tab-state">
              <Bookmark size={40} className="empty-icon" />
              <h3>Сохранённых постов пока нет</h3>
              <p>Сохраняйте интересные публикации из ленты с помощью иконки закладки.</p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '1rem' }} 
                onClick={() => navigate('/')}
              >
                <Compass size={16} /> Перейти в ленту
              </button>
            </div>
          )
        )}

        {/* SHOP / MARKETPLACE TAB */}
        {activeTab === 'shop' && (
          userProducts.length > 0 ? (
            <div className="profile-products-grid">
              {userProducts.map(product => (
                <div key={product.id} className="profile-product-card" onClick={() => navigate('/marketplace')}>
                  <div className="profile-product-img-box">
                    <img src={product.images[0]} alt={product.title} />
                    <span className="product-category-tag">{product.category}</span>
                  </div>
                  <div className="profile-product-details">
                    <h4>{product.title}</h4>
                    <div className="product-price-row">
                      <span className="current-price">{formatPrice(product.price)}</span>
                      {product.oldPrice && <span className="old-price">{formatPrice(product.oldPrice)}</span>}
                    </div>
                    <button className="btn-product-buy" onClick={(e) => { e.stopPropagation(); navigate('/marketplace'); }}>
                      Купить на маркетплейсе
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-tab-state">
              <ShoppingBag size={40} className="empty-icon" />
              <h3>Витрина пуста</h3>
              <p>{isMe ? 'Добавьте свои товары, книги, курсы или услуги для продажи.' : 'В магазине автора пока нет опубликованных товаров.'}</p>
              {isMe ? (
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '1rem' }} 
                  onClick={() => setIsCreateProductOpen(true)}
                >
                  <Plus size={16} /> Добавить товар
                </button>
              ) : (
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/marketplace')}>
                  Перейти в общий маркетплейс
                </button>
              )}
            </div>
          )
        )}
      </div>

      {/* Followers / Following Modal */}
      {modalType && (
        <FollowersModal
          isOpen={true}
          onClose={() => setModalType(null)}
          title={modalType}
          currentUserId={user.id}
          isMe={Boolean(isMe)}
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
          updateProfile(updated);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {}}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onCreatePost={(newPost) => {
          setProfilePosts(prev => [newPost, ...prev]);
          setIsCreatePostOpen(false);
        }}
      />

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onCreateStory={(newStory) => {
          setProfileStories(prev => [newStory, ...prev]);
          setIsCreateStoryOpen(false);
          alert('История успешно опубликована!');
        }}
      />

      {/* Fullscreen Story Viewer from Profile Avatar Click */}
      {isViewingStory && (
        <StoriesBar 
          stories={profileStories} 
          initialUserId={activeUser.id} 
          viewerOnly 
          onCloseViewer={() => setIsViewingStory(false)}
          onDeleteStory={handleDeleteStory}
        />
      )}

      {/* Upload Video Modal */}
      <UploadVideoModal
        isOpen={isUploadVideoOpen}
        onClose={() => setIsUploadVideoOpen(false)}
        onUploadVideo={(newVideo) => {
          setProfileVideos(prev => [newVideo, ...prev]);
          setIsUploadVideoOpen(false);
          alert('Видео успешно загружено и опубликовано на вашем канале!');
        }}
      />

      {/* Upload Podcast Modal */}
      <UploadPodcastModal
        isOpen={isUploadPodcastOpen}
        onClose={() => setIsUploadPodcastOpen(false)}
        onUploadPodcast={(newPodcast) => {
          setProfilePodcasts(prev => [newPodcast, ...prev]);
          setIsUploadPodcastOpen(false);
          alert('Подкаст успешно опубликован!');
        }}
      />

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={isCreateProductOpen}
        onClose={() => setIsCreateProductOpen(false)}
        onCreateProduct={(newProduct) => {
          setProfileProducts(prev => [newProduct, ...prev]);
          setIsCreateProductOpen(false);
          alert('Товар успешно добавлен в ваш магазин!');
        }}
      />

      {/* Consciousness Class Modal */}
      <ConsciousnessClassModal
        isOpen={isConsciousnessModalOpen}
        onClose={() => setIsConsciousnessModalOpen(false)}
        onSaved={(res) => {
          updateProfile({
            consciousnessLevel: res.level,
            consciousnessTitle: res.classInfo.title,
            cognitionVector: res.dominantVector
          });
        }}
      />
    </div>
  );
}
