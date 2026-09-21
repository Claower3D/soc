import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Grid, Video as VideoIcon, Headphones, Bookmark, 
  MapPin, Link as LinkIcon, MessageCircle, Phone, 
  UserCheck, UserPlus, Users, Share2, Edit3, Heart, MessageSquare,
  CheckCircle2, ChevronRight, Tv, ShoppingBag, Compass, Shield, Flame, LogOut, LogIn, Plus, Brain, Sparkles,
  Calendar, Moon, Film
} from 'lucide-react';
import { 
  RELIGIONS_CATALOG, type User, type Post, type Story, type Video as VideoType, 
  type Podcast, type Product 
} from '../data/mock';
import { api } from '../api';
import { syncLocalStoriesWithServer } from '../utils/syncStories';
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
  toggleUserFollowAsync,
  getFollowersForUser,
  getFollowingForUser,
  getCriticsForUser,
  isUserCritic,
  toggleUserCritic,
  getAllUsersPool,
  cacheUser 
} from '../utils/followStorage';
import './ProfilePage.css';

const getPluralForm = (n: number, one: string, few: string, many: string) => {
  const abs = Math.abs(Math.floor(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
};

export const getAvatarUrl = (u?: Partial<User> | null) => {
  if (u?.avatar && u.avatar.trim() !== '' && u.avatar !== 'undefined') {
    return u.avatar;
  }
  const seed = u?.username ? u.username.replace(/^@+/, '') : (u?.name || u?.id || 'newage_user');
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
};

export function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout, updateProfile, allAccounts } = useAuth();
  const { formatPrice } = useCurrency();

  // Normalize route param (e.g. '@claower' -> 'claower', 'me', or custom ID)
  const cleanParam = userId ? userId.replace(/^@+/, '').trim().toLowerCase() : '';
  const cleanMyUsername = currentUser?.username ? currentUser.username.replace(/^@+/, '').trim().toLowerCase() : '';
  const cleanMyId = currentUser?.id ? String(currentUser.id).trim().toLowerCase() : '';
  const isMe = !userId || 
    userId === 'me' || 
    (cleanParam !== '' && (cleanParam === cleanMyId || cleanParam === cleanMyUsername));

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [isUploadVideoOpen, setIsUploadVideoOpen] = useState(false);
  const [isUploadPodcastOpen, setIsUploadPodcastOpen] = useState(false);
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [profilePosts, setProfilePosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('new_age_user_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [profileStories, setProfileStories] = useState<Story[]>([]);
  const [isViewingStory, setIsViewingStory] = useState(false);
  const [profileVideos, setProfileVideos] = useState<VideoType[]>([]);
  const [profilePodcasts, setProfilePodcasts] = useState<Podcast[]>([]);
  const [profileProducts, setProfileProducts] = useState<Product[]>([]);

  useEffect(() => {
    const safeSet = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>) => (data: any) => {
      if (Array.isArray(data)) setter(data);
    };
    api.posts.list().then((data: any) => {
      const postsArray = data?.data || data;
      if (Array.isArray(postsArray) && postsArray.length > 0) {
        setProfilePosts(prev => {
          const ids = new Set(postsArray.map((p: any) => p.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          const merged = [...postsArray, ...localOnly];
          try {
            localStorage.setItem('new_age_user_posts', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    }).catch(console.warn);

    const targetUser = cleanParam || (currentUser?.username || currentUser?.id || '');
    if (targetUser && targetUser !== 'guest') {
      api.posts.userPosts(targetUser).then((data: any) => {
        const postsArray = data?.data || data;
        if (Array.isArray(postsArray) && postsArray.length > 0) {
          setProfilePosts(prev => {
            const ids = new Set(postsArray.map((p: any) => p.id));
            const localOnly = prev.filter(p => !ids.has(p.id));
            const merged = [...postsArray, ...localOnly];
            try {
              localStorage.setItem('new_age_user_posts', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }).catch(console.warn);
    }
    try {
      const savedStories = localStorage.getItem('new_age_user_stories');
      if (savedStories) {
        const parsed = JSON.parse(savedStories);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProfileStories(parsed);
        }
      }
    } catch { /* ignore */ }
    syncLocalStoriesWithServer().then((stories: any) => {
      if (Array.isArray(stories) && stories.length > 0) {
        setProfileStories(prev => {
          const map = new Map<string, Story>();
          prev.forEach(s => map.set(s.id, s));
          stories.forEach((s: any) => map.set(s.id, s));
          return Array.from(map.values());
        });
      }
    }).catch(console.warn);
    api.videos.list().then(safeSet(setProfileVideos)).catch(console.warn);
    api.podcasts.list().then(safeSet(setProfilePodcasts)).catch(console.warn);
    api.marketplace.products().then(safeSet(setProfileProducts)).catch(console.warn);
  }, [cleanParam]);

  useEffect(() => {
    const handlePostCreated = (e: any) => {
      const p = e.detail;
      if (p && (p.id || p.caption)) {
        setProfilePosts(prev => {
          if (prev.some(existing => existing.id === p.id)) return prev;
          const updated = [p, ...prev];
          try {
            localStorage.setItem('new_age_user_posts', JSON.stringify(updated));
          } catch {}
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
        setProfilePosts(prev => {
          const updated = prev.filter(p => p.id !== deletedId);
          try {
            localStorage.setItem('new_age_user_posts', JSON.stringify(updated));
          } catch {}
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
        setProfileStories(prev => {
          if (prev.some(existing => existing.id === s.id)) return prev;
          const updated = [s, ...prev];
          try {
            localStorage.setItem('new_age_user_stories', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    };
    window.addEventListener('story_created', handleStoryCreated);
    return () => window.removeEventListener('story_created', handleStoryCreated);
  }, []);

  const handleDeleteStory = (storyId: string) => {
    setProfileStories(prev => {
      const updated = prev.filter(s => s.id !== storyId);
      try {
        localStorage.setItem('new_age_user_stories', JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  };


  // Automatically rewrite /profile/me or legacy /profile to /profile/@username when logged in
  useEffect(() => {
    if ((!userId || userId === 'me') && isAuthenticated && cleanMyUsername && cleanMyUsername !== 'guest') {
      navigate(`/profile/@${cleanMyUsername}`, { replace: true });
    }
  }, [userId, isAuthenticated, cleanMyUsername, navigate]);

  // Dynamic real user lists & counts that exactly match FollowersModal
  const poolUsers = useMemo(() => {
    return getAllUsersPool(currentUser, allAccounts);
  }, [currentUser, allAccounts]);

  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(!isMe);
  const [userNotFound, setUserNotFound] = useState<boolean>(false);

  // Find user in local state or pool
  const initialResolvedUser = useMemo(() => {
    if (isMe) return currentUser;
    if (cleanParam) {
      return poolUsers.find(
        a => (a.id && a.id.toLowerCase() === cleanParam) || 
             (a.username && a.username.replace(/^@+/, '').toLowerCase() === cleanParam)
      ) || null;
    }
    return null;
  }, [isMe, cleanParam, currentUser, poolUsers]);

  // Fetch target user from backend API if not self
  useEffect(() => {
    if (isMe) {
      setIsLoadingUser(false);
      setUserNotFound(false);
      return;
    }

    let isMounted = true;
    setIsLoadingUser(!initialResolvedUser);
    setUserNotFound(false);

    api.users.profile(cleanParam)
      .then((res: any) => {
        if (!isMounted) return;
        const u = res?.user || res?.data?.user;
        if (u && (u.id || u.username)) {
          setFetchedUser(u);
          cacheUser(u);
          setIsLoadingUser(false);
          setUserNotFound(false);
        } else if (!initialResolvedUser) {
          setUserNotFound(true);
          setIsLoadingUser(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Could not fetch remote profile:', err);
        if (!initialResolvedUser) {
          setUserNotFound(true);
        }
        setIsLoadingUser(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cleanParam, isMe, initialResolvedUser]);

  const activeUser: User = useMemo(() => {
    if (isMe) return currentUser;
    if (fetchedUser) return fetchedUser;
    if (initialResolvedUser) return initialResolvedUser;
    return {
      id: cleanParam || 'unknown',
      name: cleanParam ? `@${cleanParam}` : 'Пользователь',
      username: cleanParam || '',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      role: 'user',
    };
  }, [isMe, currentUser, fetchedUser, initialResolvedUser, cleanParam]);

  // For compatibility with legacy code expecting `user`
  const user: User = activeUser;

  const [followingIds, setFollowingIds] = useState<string[]>(() => getStoredFollowingIds(currentUser?.id));
  const [socialRevision, setSocialRevision] = useState(0);
  const isFollowing = useMemo(() => activeUser ? isUserFollowed(activeUser.id, currentUser?.id) : false, [activeUser?.id, followingIds, currentUser?.id]);

  // Live sync with external follow & critic changes
  useEffect(() => {
    const handleSync = () => {
      setFollowingIds(getStoredFollowingIds(currentUser?.id));
      setSocialRevision(r => r + 1);
    };
    window.addEventListener('follow_change', handleSync);
    return () => window.removeEventListener('follow_change', handleSync);
  }, [currentUser?.id]);

  const realFollowersList = useMemo(() => {
    if (!activeUser) return [];
    return getFollowersForUser(activeUser.id, poolUsers, currentUser?.id);
  }, [activeUser, poolUsers, currentUser?.id, socialRevision]);

  const realFollowingList = useMemo(() => {
    if (!activeUser) return [];
    return getFollowingForUser(activeUser.id, poolUsers, !!isMe, currentUser?.id);
  }, [activeUser, poolUsers, isMe, socialRevision, currentUser?.id]);

  const realCriticsList = useMemo(() => {
    if (!activeUser) return [];
    return getCriticsForUser(activeUser.id, poolUsers);
  }, [activeUser, poolUsers, socialRevision]);

  const isCritic = useMemo(() => {
    if (!currentUser?.id || !activeUser?.id) return false;
    return isUserCritic(activeUser.id, currentUser.id);
  }, [activeUser?.id, currentUser?.id, socialRevision]);

  const [profileData, setProfileData] = useState<Partial<User> | null>(null);
  const [friendStatus, setFriendStatus] = useState<'none' | 'following' | 'friends'>('none');
  const [followActionLoading, setFollowActionLoading] = useState(false);

  useEffect(() => {
    if (activeUser?.id && activeUser.id !== 'guest') {
      api.users.profile(activeUser.id).then((res) => {
        if (res?.user) {
          setProfileData(res.user);
          if (!isMe) {
            if (res.user.isFriend) {
              setFriendStatus('friends');
            } else if (res.user.isFollowed || isUserFollowed(activeUser.id, currentUser?.id)) {
              setFriendStatus('following');
            } else {
              setFriendStatus('none');
            }
          }
        }
      }).catch(console.warn);
    }
  }, [activeUser?.id, isMe, currentUser?.id]);

  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'podcasts' | 'saved' | 'shop'>('posts');
  const [modalType, setModalType] = useState<'Подписчики' | 'Подписки' | 'Критики' | 'Друзья' | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isConsciousnessModalOpen, setIsConsciousnessModalOpen] = useState(false);

  const friendsDisplayCount = useMemo(() => {
    return (profileData as any)?.friendsCount ?? activeUser?.friendsCount ?? 0;
  }, [profileData, activeUser?.friendsCount]);

  const followersDisplayCount = useMemo(() => {
    if (profileData && typeof (profileData as any).followersCount === 'number') {
      return (profileData as any).followersCount;
    }
    return realFollowersList.length;
  }, [profileData, realFollowersList.length]);

  const followingDisplayCount = useMemo(() => {
    if (isMe) {
      if (profileData && typeof (profileData as any).followingCount === 'number') {
        return (profileData as any).followingCount;
      }
      return realFollowingList.length;
    }
    if (profileData && typeof (profileData as any).followingCount === 'number') {
      return (profileData as any).followingCount;
    }
    return realFollowingList.length;
  }, [isMe, profileData, realFollowingList.length]);

  const userHasStories = useMemo(() => {
    if (!activeUser) return false;
    const targetId = activeUser.id ? String(activeUser.id).toLowerCase() : '';
    const targetUsername = activeUser.username ? activeUser.username.replace(/^@+/, '').toLowerCase() : '';
    const cleanP = cleanParam || '';

    return profileStories.some(s => {
      const sUserId = s.user?.id ? String(s.user.id).toLowerCase() : '';
      const sUsername = s.user?.username ? s.user.username.replace(/^@+/, '').toLowerCase() : '';
      
      if (targetId && (sUserId === targetId || sUsername === targetId)) return true;
      if (targetUsername && (sUsername === targetUsername || sUserId === targetUsername)) return true;
      if (cleanP && (sUserId === cleanP || sUsername === cleanP)) return true;
      if (isMe && (sUserId === 'me' || sUserId === cleanMyId || sUsername === cleanMyUsername)) return true;
      return false;
    });
  }, [profileStories, activeUser, isMe, cleanParam, cleanMyId, cleanMyUsername]);

  // Filter user's posts, videos, and podcasts
  const userPosts = useMemo(() => {
    if (!activeUser) return [];
    const targetId = activeUser.id ? String(activeUser.id).toLowerCase() : '';
    const targetUsername = activeUser.username ? activeUser.username.replace(/^@+/, '').toLowerCase() : '';
    const myId = currentUser?.id ? String(currentUser.id).toLowerCase() : '';
    const myUsername = currentUser?.username ? currentUser.username.replace(/^@+/, '').toLowerCase() : '';
    const cleanP = cleanParam ? cleanParam.replace(/^@+/, '').toLowerCase() : '';

    return profilePosts.filter(p => {
      const pUserId = p.user?.id ? String(p.user.id).toLowerCase() : '';
      const pUsername = p.user?.username ? p.user.username.replace(/^@+/, '').toLowerCase() : '';
      const fallbackUserId = (p as any).userId ? String((p as any).userId).toLowerCase() : '';
      const pUserID = (p as any).userID ? String((p as any).userID).toLowerCase() : '';

      if (targetId && (pUserId === targetId || fallbackUserId === targetId || pUserID === targetId)) return true;
      if (targetUsername && (pUsername === targetUsername || pUserId === targetUsername || pUserID === targetUsername)) return true;
      if (cleanP && (pUsername === cleanP || pUserId === cleanP || pUserID === cleanP)) return true;
      if (isMe) {
        if (pUserId === 'me' || (myId && (pUserId === myId || fallbackUserId === myId || pUserID === myId))) return true;
        if (myUsername && (pUsername === myUsername || pUserId === myUsername || pUserID === myUsername)) return true;
      }
      return false;
    });
  }, [profilePosts, activeUser, isMe, currentUser, cleanParam]);

  const savedPosts = useMemo(() => {
    return profilePosts.filter(p => p.saved);
  }, [profilePosts]);

  const userVideos = useMemo(() => {
    if (!activeUser) return [];
    return profileVideos.filter(v => v.channel.id === activeUser.id || (isMe && (v.channel.id === 'me' || v.channel.id === currentUser.id)));
  }, [profileVideos, activeUser, isMe, currentUser]);

  const userPodcasts = useMemo(() => {
    if (!activeUser) return [];
    return profilePodcasts.filter(p => 
      (activeUser.name && p.author.toLowerCase().includes(activeUser.name.split(' ')[0].toLowerCase())) ||
      (isMe && p.author.toLowerCase().includes(currentUser.name.split(' ')[0].toLowerCase()))
    );
  }, [profilePodcasts, activeUser, isMe, currentUser]);

  const userProducts = useMemo(() => {
    if (!activeUser) return [];
    return profileProducts.filter(p => p.seller.id === activeUser.id || (isMe && (p.seller.id === 'me' || p.seller.id === currentUser.id)));
  }, [profileProducts, activeUser, isMe, currentUser]);

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!activeUser || !activeUser.id) return;

    setFollowActionLoading(true);
    try {
      if (friendStatus === 'friends') {
        await api.users.removeFriend(activeUser.id);
        toggleUserFollow(activeUser.id, currentUser?.id, activeUser);
        setFriendStatus('none');
        setFollowingIds(getStoredFollowingIds(currentUser?.id));
        setSocialRevision(r => r + 1);
        setProfileData(prev => prev ? {
          ...prev,
          isFriend: false,
          isFollowed: false,
          friendsCount: Math.max(0, ((prev as any).friendsCount || 1) - 1),
          followersCount: Math.max(0, ((prev as any).followersCount || 1) - 1)
        } : null);
      } else {
        const res = await toggleUserFollowAsync(activeUser.id, currentUser?.id, activeUser);
        setFollowingIds(getStoredFollowingIds(currentUser?.id));
        setSocialRevision(r => r + 1);

        if (res.isFriend || res.status === 'accepted') {
          setFriendStatus('friends');
        } else if (res.isFollowed) {
          setFriendStatus('following');
        } else {
          setFriendStatus('none');
        }

        setProfileData(prev => prev ? {
          ...prev,
          isFriend: res.isFriend,
          isFollowed: res.isFollowed,
          friendsCount: res.friendsCount ?? (prev as any).friendsCount,
          followersCount: res.followersCount ?? (prev as any).followersCount,
          followingCount: res.followingCount ?? (prev as any).followingCount
        } : null);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setFollowActionLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    const target = activeUser.username || activeUser.id;
    navigate(`/messenger?user=${encodeURIComponent(target)}`);
  };

  const handleStartCall = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    navigate('/conferences');
  };

  const handleShareProfile = () => {
    if (!activeUser) return;
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

  if (isLoadingUser && (!activeUser || activeUser.id === currentUser.id)) {
    return (
      <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (userNotFound) {
    return (
      <div className="profile-page" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '420px', margin: '0 auto', background: 'var(--color-bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text)' }}>Пользователь не найден</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Профиль @{cleanParam} не существует или был удалён.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/search')}>
            Перейти к поиску
          </button>
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
                <img 
                  src={getAvatarUrl(activeUser)} 
                  alt={activeUser.name} 
                  className={`profile-main-avatar ${activeUser.isPremium ? 'profile-premium-frame' : ''}`} 
                  onError={(e) => {
                    const seed = activeUser?.username ? activeUser.username.replace(/^@+/, '') : (activeUser?.name || 'newage_user');
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
                  }}
                />
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
                  <span className="stat-count">{userPosts.length}</span>
                  <span className="stat-label">{getPluralForm(userPosts.length, 'пост', 'поста', 'постов')}</span>
                </div>
                <div className="stat-item clickable" onClick={() => setModalType('Друзья')}>
                  <span className="stat-count">{friendsDisplayCount}</span>
                  <span className="stat-label">{getPluralForm(friendsDisplayCount, 'друг', 'друга', 'друзей')}</span>
                </div>
                <div className="stat-item clickable" onClick={() => setModalType('Подписчики')}>
                  <span className="stat-count">{followersDisplayCount.toLocaleString('ru-RU')}</span>
                  <span className="stat-label">{getPluralForm(followersDisplayCount, 'подписчик', 'подписчика', 'подписчиков')}</span>
                </div>
                <div className="stat-item clickable" onClick={() => setModalType('Подписки')}>
                  <span className="stat-count">{followingDisplayCount.toLocaleString('ru-RU')}</span>
                  <span className="stat-label">{getPluralForm(followingDisplayCount, 'подписка', 'подписки', 'подписок')}</span>
                </div>
              </div>

              {/* Substats (Clips, Critics) */}
              {(((profileData as any)?.clipsCount ?? 0) > 0 || realCriticsList.length > 0) && (
                <div className="profile-substats-row">
                  {realCriticsList.length > 0 && (
                    <div className="substat-item clickable" onClick={() => setModalType('Критики')} title="Критики профиля">
                      <Flame size={13} className="critic-flame-icon" />
                      <span><b>{realCriticsList.length.toLocaleString('ru-RU')}</b> {getPluralForm(realCriticsList.length, 'критик', 'критика', 'критиков')}</span>
                    </div>
                  )}
                  {((profileData as any)?.clipsCount ?? 0) > 0 && (
                    <div className="substat-item">
                      <span><b>{(profileData as any)?.clipsCount}</b> {getPluralForm((profileData as any)?.clipsCount, 'волна', 'волны', 'волн')}</span>
                    </div>
                  )}
                </div>
              )}

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
                        ? (activeUser.consciousnessTitle.includes('—') ? activeUser.consciousnessTitle.split('—')[1].trim() : activeUser.consciousnessTitle)
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
                  disabled={followActionLoading}
                  className={`btn ${
                    friendStatus === 'friends'
                      ? 'btn-friends'
                      : friendStatus === 'following'
                      ? 'btn-following'
                      : 'btn-primary'
                  }`}
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthModalOpen(true);
                      return;
                    }
                    handleToggleFollow();
                  }}
                  title={
                    friendStatus === 'friends'
                      ? 'Вы взаимные друзья. Нажмите, чтобы удалить из друзей'
                      : friendStatus === 'following'
                      ? 'Вы подписаны. Нажмите, чтобы отписаться'
                      : 'Подписаться на пользователя'
                  }
                >
                  {friendStatus === 'friends' ? (
                    <>
                      <Users size={16} /> В друзьях
                    </>
                  ) : friendStatus === 'following' ? (
                    <>
                      <UserCheck size={16} /> Вы подписаны
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
              {userPosts.map((post, index) => {
                const media = post.image || (post as any).mediaUrl || (post as any).media_url || (post as any).imageUrl || '';
                const caption = post.caption || (post as any).text || (post as any).content || '';
                const isVideo = media && (media.startsWith('data:video') || media.endsWith('.mp4') || media.includes('/videos/'));
                const hasImage = media && media.trim() !== '' && !isVideo;

                return (
                  <div
                    key={post.id || `post_${index}`}
                    className="grid-post-item"
                    onClick={() => setSelectedPost({ ...post, image: media, caption })}
                  >
                    {isVideo ? (
                      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                        <video src={media} className="grid-post-img" muted playsInline />
                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                          <Film size={14} color="white" />
                        </div>
                      </div>
                    ) : hasImage ? (
                      <img 
                        src={media} 
                        alt={caption || 'Публикация'} 
                        className="grid-post-img" 
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#fff',
                        boxSizing: 'border-box',
                      }}>
                        <Sparkles size={22} style={{ marginBottom: '8px', opacity: 0.85 }} />
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {caption || `Публикация #${index + 1}`}
                        </p>
                      </div>
                    )}
                    <div className="grid-post-overlay">
                      <div className="overlay-stat">
                        <Heart size={18} fill="white" />
                        <span>{post.likes || 0}</span>
                      </div>
                      <div className="overlay-stat">
                        <MessageSquare size={18} fill="white" />
                        <span>{post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                    <span className="pod-card-eps">{pod.episodes?.length || 0} выпусков</span>
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
                      <span>{post.comments?.length || 0}</span>
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
          onDeletePost={(postId) => {
            setProfilePosts(prev => {
              const updated = prev.filter(p => p.id !== postId);
              try {
                localStorage.setItem('new_age_user_posts', JSON.stringify(updated));
              } catch {}
              return updated;
            });
            setSelectedPost(null);
          }}
        />
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={(updated) => {
          updateProfile(updated);
          setIsEditProfileOpen(false);
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
          setProfilePosts(prev => {
            const updated = [newPost, ...prev];
            try {
              localStorage.setItem('new_age_user_posts', JSON.stringify(updated));
            } catch {}
            return updated;
          });
          setIsCreatePostOpen(false);
        }}
      />

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onCreateStory={(newStory) => {
          setProfileStories(prev => {
            const updated = [newStory, ...prev];
            try {
              localStorage.setItem('new_age_user_stories', JSON.stringify(updated));
            } catch { /* ignore */ }
            return updated;
          });
          setIsCreateStoryOpen(false);
          alert('История успешно опубликована!');
        }}
      />

      {/* Fullscreen Story Viewer from Profile Avatar Click */}
      {isViewingStory && (
        <StoriesBar 
          stories={profileStories} 
          initialUserId={activeUser.username ? activeUser.username.replace(/^@+/, '') : activeUser.id} 
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
