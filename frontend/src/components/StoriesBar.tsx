import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, X, Heart, Send, ChevronLeft, ChevronRight, 
  Pause, Play, Sparkles, Wand2, Volume2, VolumeX, 
  MoreHorizontal, User as UserIcon, BarChart2, 
  Search, Info, CheckCircle2, Music, Film,
  Share2, ArrowLeft
} from 'lucide-react';
import { type Story, type User, type StoryStats } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { CreateStoryModal, STORY_FILTERS } from './CreateStoryModal';
import './StoriesBar.css';

export interface UserStoryGroup {
  user: User;
  stories: Story[];
  hasUnviewed: boolean;
  isLive: boolean;
  liveViewers?: number;
}

export interface StoriesBarProps {
  stories: Story[];
  onAddStory?: (newStory: Story) => void;
  onDeleteStory?: (storyId: string) => void;
  initialUserId?: string | null;
  onCloseViewer?: () => void;
  viewerOnly?: boolean;
}

export function StoriesBar({ 
  stories, 
  onAddStory, 
  onDeleteStory,
  initialUserId,
  onCloseViewer,
  viewerOnly = false 
}: StoriesBarProps) {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  
  // Track viewed story IDs in localStorage
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('new_age_viewed_stories');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Group stories by author (UserStoryGroup)
  const userGroups = useMemo<UserStoryGroup[]>(() => {
    const groupsMap = new Map<string, Story[]>();

    stories.forEach(s => {
      const uid = (s.user?.username ? s.user.username.replace(/^@+/, '').toLowerCase() : (s.user?.id || 'unknown'));
      if (!groupsMap.has(uid)) {
        groupsMap.set(uid, []);
      }
      groupsMap.get(uid)!.push(s);
    });

    const list: UserStoryGroup[] = [];
    groupsMap.forEach((userStories) => {
      const user = userStories[0].user;
      const hasUnviewed = userStories.some(s => !viewedStoryIds.has(s.id) && !s.viewed);
      const isLive = userStories.some(s => s.isLive);
      const liveStory = userStories.find(s => s.isLive);
      list.push({
        user,
        stories: userStories,
        hasUnviewed,
        isLive,
        liveViewers: liveStory?.liveViewers,
      });
    });

    return list;
  }, [stories, viewedStoryIds]);

  // Active story viewer state (Active Group Index and Story Index inside that group)
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [activeStoryIdxInGroup, setActiveStoryIdxInGroup] = useState<number>(0);

  // Auto-open if initialUserId passed
  useEffect(() => {
    if (initialUserId) {
      const cleanInit = initialUserId.replace(/^@+/, '').toLowerCase();
      const gIdx = userGroups.findIndex(g => {
        const gid = g.user.id ? String(g.user.id).toLowerCase() : '';
        const guser = g.user.username ? g.user.username.replace(/^@+/, '').toLowerCase() : '';
        return gid === cleanInit || guser === cleanInit || g.user.id === initialUserId || g.user.username === initialUserId;
      });
      if (gIdx !== -1) {
        setActiveGroupIndex(gIdx);
        setActiveStoryIdxInGroup(0);
      } else if (viewerOnly && userGroups.length > 0) {
        setActiveGroupIndex(0);
        setActiveStoryIdxInGroup(0);
      }
    }
  }, [initialUserId, userGroups, viewerOnly]);

  const [progress, setProgress] = useState(0); // 0 to 100%
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  
  // Modals inside viewer
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [statsTab, setStatsTab] = useState<'overview' | 'viewers'>('overview');
  const [viewerSearchQuery, setViewerSearchQuery] = useState('');

  const currentGroup = activeGroupIndex !== null ? userGroups[activeGroupIndex] : null;
  const activeStory = currentGroup ? currentGroup.stories[activeStoryIdxInGroup] : null;

  // Mark story as viewed
  const markStoryViewed = (storyId: string) => {
    setViewedStoryIds(prev => {
      const next = new Set(prev);
      next.add(storyId);
      localStorage.setItem('new_age_viewed_stories', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleOpenGroup = (groupIndex: number, storyIndex = 0) => {
    setActiveGroupIndex(groupIndex);
    setActiveStoryIdxInGroup(storyIndex);
    setProgress(0);
    setIsPaused(false);
    setIsOptionsMenuOpen(false);
    setIsStatsOpen(false);
    setReplyText('');
    const story = userGroups[groupIndex]?.stories[storyIndex];
    if (story) {
      markStoryViewed(story.id);
    }
  };

  const handleClose = () => {
    setActiveGroupIndex(null);
    setActiveStoryIdxInGroup(0);
    setProgress(0);
    setIsPaused(false);
    setIsOptionsMenuOpen(false);
    setIsStatsOpen(false);
    if (onCloseViewer) {
      onCloseViewer();
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activeGroupIndex === null || !currentGroup) return;

    if (activeStoryIdxInGroup > 0) {
      // Previous story of same user
      const prevIdx = activeStoryIdxInGroup - 1;
      setActiveStoryIdxInGroup(prevIdx);
      setProgress(0);
      markStoryViewed(currentGroup.stories[prevIdx].id);
    } else if (activeGroupIndex > 0) {
      // Previous user group (last story of previous user)
      const prevGroupIdx = activeGroupIndex - 1;
      const prevUserStories = userGroups[prevGroupIdx].stories;
      const lastStoryIdx = prevUserStories.length - 1;
      setActiveGroupIndex(prevGroupIdx);
      setActiveStoryIdxInGroup(lastStoryIdx);
      setProgress(0);
      markStoryViewed(prevUserStories[lastStoryIdx].id);
    } else {
      setProgress(0);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activeGroupIndex === null || !currentGroup) return;

    if (activeStoryIdxInGroup < currentGroup.stories.length - 1) {
      // Next story of same user
      const nextIdx = activeStoryIdxInGroup + 1;
      setActiveStoryIdxInGroup(nextIdx);
      setProgress(0);
      markStoryViewed(currentGroup.stories[nextIdx].id);
    } else if (activeGroupIndex < userGroups.length - 1) {
      // Next user group (first story)
      const nextGroupIdx = activeGroupIndex + 1;
      setActiveGroupIndex(nextGroupIdx);
      setActiveStoryIdxInGroup(0);
      setProgress(0);
      markStoryViewed(userGroups[nextGroupIdx].stories[0].id);
    } else {
      handleClose();
    }
  };

  // 5-second automatic progression timer like Instagram
  useEffect(() => {
    if (activeStory === null || isPaused || isOptionsMenuOpen || isStatsOpen) return;

    const interval = 50; // Update every 50ms for smooth bar
    const step = 100 / (5000 / interval); // Total 5000ms

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeStory, isPaused, isOptionsMenuOpen, isStatsOpen, activeStoryIdxInGroup, activeGroupIndex, userGroups]);

  // Keyboard navigation
  useEffect(() => {
    if (activeStory === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isStatsOpen) setIsStatsOpen(false);
        else if (isOptionsMenuOpen) setIsOptionsMenuOpen(false);
        else handleClose();
      } else if (e.key === 'ArrowRight' && !isStatsOpen && !isOptionsMenuOpen) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && !isStatsOpen && !isOptionsMenuOpen) {
        handlePrev();
      } else if (e.key === ' ' && !isStatsOpen && !isOptionsMenuOpen) {
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStory, isStatsOpen, isOptionsMenuOpen, activeStoryIdxInGroup, activeGroupIndex]);

  const handleAuthorClick = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    handleClose();
    if (user.id === 'me' || user.id === currentUser.id) {
      navigate(currentUser.username ? `/profile/@${currentUser.username}` : `/profile/${currentUser.id}`);
    } else {
      navigate(user.username ? `/profile/@${user.username}` : `/profile/${user.id}`);
    }
  };

  const isCurrentLiked = activeStory ? !!likedMap[activeStory.id] : false;

  const handleToggleLike = () => {
    if (!isAuthenticated) {
      openAuthModal('register');
      return;
    }
    if (!activeStory) return;
    setLikedMap(prev => ({
      ...prev,
      [activeStory.id]: !prev[activeStory.id]
    }));
  };

  const handleSendReply = () => {
    if (!isAuthenticated) {
      openAuthModal('register');
      return;
    }
    if (!replyText.trim() || !activeStory) return;
    alert(`Сообщение «${replyText}» отправлено автору ${activeStory.user.name}`);
    setReplyText('');
  };

  const handleDeleteCurrentStory = () => {
    if (!activeStory) return;
    if (window.confirm('Удалить эту историю? Это действие нельзя отменить.')) {
      if (onDeleteStory) {
        onDeleteStory(activeStory.id);
      }
      setIsOptionsMenuOpen(false);
      // Advance to next or close
      if (currentGroup && currentGroup.stories.length > 1) {
        if (activeStoryIdxInGroup > 0) {
          setActiveStoryIdxInGroup(activeStoryIdxInGroup - 1);
        } else {
          setActiveStoryIdxInGroup(0);
        }
        setProgress(0);
      } else {
        handleClose();
      }
    }
  };

  // Get active story stats fallback
  const activeStats: StoryStats = useMemo(() => {
    if (activeStory?.stats) return activeStory.stats;
    const viewsCount = activeStory?.viewsCount || 0;
    return {
      viewsCount,
      followersPercent: 0,
      nonFollowersPercent: 0,
      uniqueViewersCount: viewsCount,
      interactionsCount: 0,
      storyInteractionsCount: 0,
      likesCount: 0,
      sharesCount: 0,
      repliesCount: 0,
      navigationTotal: 0,
      navigationForward: 0,
      navigationExits: 0,
      navigationNext: 0,
      profileActions: 0,
      profileVisits: 0,
      linkClicks: 0,
      companyAddressClicks: 0,
      followsCount: 0,
      viewers: [],
    };
  }, [activeStory]);

  // Filtered viewers list in statistics tab
  const filteredViewers = useMemo(() => {
    const list = activeStats.viewers || [];
    if (!viewerSearchQuery.trim()) return list;
    const q = viewerSearchQuery.toLowerCase();
    return list.filter(v => 
      v.name.toLowerCase().includes(q) || 
      v.username.toLowerCase().includes(q)
    );
  }, [activeStats, viewerSearchQuery]);

  // Check if current user has active stories
  const isMeUser = (user: User) => {
    if (!currentUser) return false;
    const uid = user.id ? String(user.id).toLowerCase() : '';
    const username = user.username ? user.username.replace(/^@+/, '').toLowerCase() : '';
    const myId = currentUser.id ? String(currentUser.id).toLowerCase() : '';
    const myUsername = currentUser.username ? currentUser.username.replace(/^@+/, '').toLowerCase() : '';
    return uid === 'me' || (myId && uid === myId) || (myUsername && (username === myUsername || uid === myUsername));
  };

  const myStoriesGroup = userGroups.find(g => isMeUser(g.user));

  return (
    <>
      {/* 1. Instagram Horizontal Stories Tray (if not viewerOnly) */}
      {!viewerOnly && (
        <div className="instagram-stories-tray">
          <div className="stories-scroll-track">
            
            {/* Own Story Bubble ("Ваша история") */}
            <div 
              className={`insta-story-item own-story-bubble ${myStoriesGroup ? (myStoriesGroup.hasUnviewed ? 'unviewed' : 'viewed') : ''}`}
              onClick={() => {
                if (myStoriesGroup && myStoriesGroup.stories.length > 0) {
                  const gIdx = userGroups.indexOf(myStoriesGroup);
                  handleOpenGroup(gIdx >= 0 ? gIdx : 0, 0);
                } else {
                  if (!isAuthenticated) openAuthModal('register');
                  else setIsCreateStoryOpen(true);
                }
              }}
            >
              <div className={`insta-avatar-ring ${myStoriesGroup && myStoriesGroup.stories.length > 0 ? (myStoriesGroup.hasUnviewed ? 'ring-gradient' : 'ring-viewed') : 'own-ring'}`}>
                <div className="insta-avatar-inner">
                  <img 
                    src={currentUser.avatar && currentUser.avatar.trim() !== '' && currentUser.avatar !== 'undefined' ? currentUser.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.username || currentUser.name || 'user')}`} 
                    alt="Ваша история" 
                    className="insta-avatar-img" 
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.username || currentUser.name || 'user')}`;
                    }}
                  />
                  {/* Plus badge */}
                  <div 
                    className="insta-plus-badge"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAuthenticated) openAuthModal('register');
                      else setIsCreateStoryOpen(true);
                    }}
                    title="Создать историю"
                  >
                    <Plus size={13} strokeWidth={3} />
                  </div>
                </div>
              </div>
              <span className="insta-story-username">Ваша история</span>
            </div>

            {/* Other Users' Grouped Stories */}
            {userGroups
              .filter(group => !isMeUser(group.user))
              .map((group) => {
                const groupIdx = userGroups.indexOf(group);
                const displayName = (group.user.name || group.user.username || 'Пользователь').split(' ')[0];
                return (
                  <div 
                    key={group.user.id || group.user.username} 
                    className={`insta-story-item ${group.isLive ? 'live-story' : (group.hasUnviewed ? 'unviewed' : 'viewed')}`}
                    onClick={() => handleOpenGroup(groupIdx >= 0 ? groupIdx : 0, 0)}
                  >
                    <div className={`insta-avatar-ring ${group.isLive ? 'ring-live' : (group.hasUnviewed ? 'ring-gradient' : 'ring-viewed')}`}>
                      <div className="insta-avatar-inner">
                        <img 
                          src={group.user.avatar && group.user.avatar.trim() !== '' && group.user.avatar !== 'undefined' ? group.user.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(group.user.username || group.user.name || group.user.id)}`} 
                          alt={group.user.name || group.user.username} 
                          className="insta-avatar-img" 
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(group.user.username || group.user.name || group.user.id)}`;
                          }}
                        />
                        {group.user.online && !group.isLive && <span className="insta-online-indicator" />}
                      </div>
                      {group.isLive && (
                        <span className="insta-live-tag-badge">LIVE</span>
                      )}
                    </div>
                    <span className="insta-story-username">{displayName}</span>
                  </div>
                );
              })}

          </div>
        </div>
      )}

      {/* 2. Fullscreen Instagram Story Viewer Modal with Split Statistics View */}
      {activeStory && currentGroup && (
        <div 
          className={`insta-viewer-overlay ${isStatsOpen ? 'has-stats-open' : ''}`}
          onClick={handleClose}
        >
          {/* Desktop Navigation Arrows */}
          <button 
            type="button"
            className="insta-nav-arrow arrow-left" 
            onClick={handlePrev}
            disabled={activeGroupIndex === 0 && activeStoryIdxInGroup === 0}
            title="Предыдущая история"
          >
            <ChevronLeft size={28} />
          </button>

          <button 
            type="button"
            className="insta-nav-arrow arrow-right" 
            onClick={handleNext}
            title="Следующая история"
          >
            <ChevronRight size={28} />
          </button>

          {/* Top Close Button */}
          <button 
            type="button"
            className="insta-viewer-close-btn" 
            onClick={handleClose}
            title="Закрыть (Esc)"
          >
            <X size={26} />
          </button>

          {/* Main Viewer Wrapper (Story Card + Optional Right Side Statistics Panel) */}
          <div 
            className="insta-viewer-stage"
            onClick={e => e.stopPropagation()}
          >
            {/* --- STORY CARD (9:16 Phone Aspect Ratio) --- */}
            <div 
              className="insta-story-card" 
              onMouseDown={() => setIsPaused(true)}
              onMouseUp={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {/* Multi-segment Progress Bars for this specific author */}
              <div className="insta-progress-row">
                {currentGroup.stories.map((s, idx) => {
                  let barWidth = '0%';
                  if (idx < activeStoryIdxInGroup) barWidth = '100%';
                  else if (idx === activeStoryIdxInGroup) barWidth = `${progress}%`;

                  return (
                    <div key={s.id} className="insta-progress-segment">
                      <div 
                        className="insta-progress-fill" 
                        style={{ width: barWidth }} 
                      />
                    </div>
                  );
                })}
              </div>

              {/* Top Author Header */}
              <div className="insta-story-header">
                <div 
                  className="insta-header-user"
                  onClick={(e) => handleAuthorClick(activeStory.user, e)}
                >
                  <img 
                    src={activeStory.user.avatar && activeStory.user.avatar.trim() !== '' && activeStory.user.avatar !== 'undefined' ? activeStory.user.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeStory.user.username || activeStory.user.name || activeStory.user.id)}`} 
                    alt={activeStory.user.name} 
                    className="insta-header-avatar" 
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activeStory.user.username || activeStory.user.name || activeStory.user.id)}`;
                    }}
                  />
                  <div className="insta-header-text">
                    <div className="insta-header-title-row">
                      <span className="insta-header-name">{activeStory.user.name}</span>
                      {activeStory.user.verified && (
                        <CheckCircle2 size={13} className="insta-verified-check" />
                      )}
                      <span className="insta-header-dot">•</span>
                      <span className="insta-header-time">
                        {activeStory.isLive ? 'LIVE' : (activeStory.timestamp || '2 ч')}
                      </span>
                    </div>

                    {/* Reels or Music Subtitle (Screenshots 2 & 3) */}
                    {activeStory.reelsSourceTitle && (
                      <div className="insta-header-subrow reels-subrow" title="Перейти к видео Reels">
                        <Film size={11} className="subrow-icon" />
                        <span>{activeStory.reelsSourceTitle}</span>
                        <ChevronRight size={11} />
                      </div>
                    )}
                    {activeStory.musicTrack && (
                      <div className="insta-header-subrow music-subrow" title="Аудиодорожка">
                        <Music size={11} className="subrow-icon" />
                        <span>{activeStory.musicTrack}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Header Action Icons: Sound, Pause, Three Dots ••• */}
                <div className="insta-header-actions">
                  {/* Applied Filter / Mask Pills */}
                  {activeStory.filter && (
                    <span className="story-meta-pill" title="Применен фильтр">
                      <Wand2 size={11} /> {activeStory.filter}
                    </span>
                  )}
                  {activeStory.mask && (
                    <span className="story-meta-pill" title="Применена маска">
                      <Sparkles size={11} /> {activeStory.mask}
                    </span>
                  )}

                  {/* Volume Toggle */}
                  <button 
                    type="button" 
                    className="insta-header-icon-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(m => !m);
                    }}
                    title={isMuted ? 'Включить звук' : 'Без звука'}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  {/* Play/Pause Toggle */}
                  <button 
                    type="button" 
                    className="insta-header-icon-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPaused(p => !p);
                    }}
                    title={isPaused ? 'Продолжить' : 'Пауза'}
                  >
                    {isPaused ? <Play size={18} /> : <Pause size={18} />}
                  </button>

                  {/* Three Dots Context Menu Button (•••) */}
                  <button 
                    type="button" 
                    className="insta-header-icon-btn options-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPaused(true);
                      setIsOptionsMenuOpen(true);
                    }}
                    title="Опции истории"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>

              {/* Story Visual Content (Image, Video or Gradient) */}
              {(() => {
                const appliedFilter = STORY_FILTERS.find(f => f.name === activeStory.filter)?.filterCss || 'none';

                return (
                  <div 
                    className="insta-story-media"
                    style={{
                      background: activeStory.gradient 
                        ? activeStory.gradient 
                        : (activeStory.videoUrl ? '#000000' : `url(${activeStory.image || activeStory.user.avatar}) center/cover no-repeat`),
                      filter: appliedFilter,
                    }}
                  >
                    {/* Video Player if recorded video story */}
                    {activeStory.videoUrl ? (
                      <video
                        src={activeStory.videoUrl}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        className="insta-story-full-img"
                      />
                    ) : (
                      activeStory.image && !activeStory.gradient && (
                        <img 
                          src={activeStory.image} 
                          alt="Story content" 
                          className="insta-story-full-img" 
                        />
                      )
                    )}

                    {/* AR Mask Overlay */}
                    {activeStory.mask && (
                      <div className="viewer-ar-mask-overlay">
                        {activeStory.mask.includes('очки') && <span className="mask-element ar-glasses">🕶️</span>}
                        {activeStory.mask.includes('корона') && <span className="mask-element ar-crown">👑</span>}
                        {activeStory.mask.includes('ушки') && <span className="mask-element ar-cat-ears">🐱</span>}
                        {activeStory.mask.includes('Нимб') && <span className="mask-element ar-halo">😇</span>}
                        {activeStory.mask.includes('визор') && <span className="mask-element ar-visor">🥽</span>}
                        {activeStory.mask.includes('Блестки') && <span className="mask-element ar-sparkles">✨</span>}
                      </div>
                    )}

                    {/* Story Caption Text */}
                    {activeStory.text && (
                      <div className={`insta-story-text-badge pos-${activeStory.textPosition || 'center'}`}>
                        <p>{activeStory.text}</p>
                      </div>
                    )}

                    {/* Interactive Tap Zones */}
                    <div className="insta-tap-zones">
                      <div 
                        className="insta-tap-zone-left" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrev();
                        }} 
                      />
                      <div 
                        className="insta-tap-zone-right" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNext();
                        }} 
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Bottom Left Viewers Counter & Avatars Stack (Screenshot 2) */}
              <div 
                className="insta-story-viewers-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused(true);
                  setIsStatsOpen(true);
                  setStatsTab('overview');
                }}
                title="Посмотреть статистику и зрителей истории"
              >
                <div className="viewers-avatar-stack">
                  {(activeStats.viewers || []).slice(0, 3).map((v, i) => (
                    <img 
                      key={v.id || i}
                      src={v.avatar} 
                      alt={v.name} 
                      className="viewer-stack-avatar"
                      style={{ zIndex: 3 - i }}
                    />
                  ))}
                </div>
                <span className="viewers-count-label">
                  Просмотрено: {activeStats.viewsCount || 12}
                </span>
              </div>

              {/* Bottom Interactive Instagram Footer */}
              <div className="insta-story-footer" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  className="insta-story-input"
                  placeholder={`Ответить ${activeStory.user.name.split(' ')[0]}...`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSendReply();
                    }
                  }}
                />

                <button 
                  type="button" 
                  className={`insta-story-like-btn ${isCurrentLiked ? 'liked' : ''}`}
                  onClick={handleToggleLike}
                  title="Нравится"
                >
                  <Heart size={22} fill={isCurrentLiked ? '#ef4444' : 'none'} color={isCurrentLiked ? '#ef4444' : '#ffffff'} />
                </button>

                {replyText.trim() && (
                  <button 
                    type="button" 
                    className="insta-story-send-btn"
                    onClick={handleSendReply}
                    title="Отправить"
                  >
                    <Send size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* --- RIGHT SIDE / MODAL INSTAGRAM STORY INSIGHTS (Screenshots 4 & 5) --- */}
            {isStatsOpen && (
              <div className="insta-stats-panel" onClick={e => e.stopPropagation()}>
                {/* Statistics Header */}
                <div className="stats-panel-header">
                  <div className="stats-header-title-box">
                    <button 
                      type="button" 
                      className="stats-back-btn" 
                      onClick={() => setIsStatsOpen(false)}
                      title="Назад к просмотру"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <h3 className="stats-panel-title">Статистика истории</h3>
                  </div>
                  <button 
                    type="button" 
                    className="stats-close-btn" 
                    onClick={() => setIsStatsOpen(false)}
                    title="Закрыть статистику"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Tab Switcher: «Обзор» & «Зрители» */}
                <div className="stats-nav-tabs">
                  <button 
                    type="button"
                    className={`stats-nav-tab ${statsTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setStatsTab('overview')}
                  >
                    <BarChart2 size={16} /> Обзор
                  </button>
                  <button 
                    type="button"
                    className={`stats-nav-tab ${statsTab === 'viewers' ? 'active' : ''}`}
                    onClick={() => setStatsTab('viewers')}
                  >
                    <UserIcon size={16} /> Зрители ({activeStats.viewsCount})
                  </button>
                </div>

                {/* Tab 1: Overview Analytics (Matching Screenshots 4 & 5) */}
                {statsTab === 'overview' && (
                  <div className="stats-panel-scrollable">
                    
                    {/* Section 1: Просмотры */}
                    <div className="stats-metric-card">
                      <div className="stats-metric-header">
                        <span className="metric-title">Просмотры</span>
                        <Info size={15} className="metric-info-icon" />
                      </div>
                      <div className="metric-main-stat-row">
                        <span className="metric-sublabel">Просмотры</span>
                        <span className="metric-value-bold">{activeStats.viewsCount}</span>
                      </div>

                      {/* Followers Progress Bar (Magenta #E1306C) */}
                      <div className="stats-progress-group">
                        <div className="progress-label-row">
                          <span className="progress-item-name">Подписчики</span>
                          <span className="progress-item-pct">{activeStats.followersPercent}%</span>
                        </div>
                        <div className="stats-bar-track">
                          <div 
                            className="stats-bar-fill fill-magenta" 
                            style={{ width: `${activeStats.followersPercent}%` }} 
                          />
                        </div>
                      </div>

                      {/* Non-followers Progress Bar (White/Light gray) */}
                      <div className="stats-progress-group">
                        <div className="progress-label-row">
                          <span className="progress-item-name">Неподписчики</span>
                          <span className="progress-item-pct">{activeStats.nonFollowersPercent}%</span>
                        </div>
                        <div className="stats-bar-track">
                          <div 
                            className="stats-bar-fill fill-white" 
                            style={{ width: `${activeStats.nonFollowersPercent}%` }} 
                          />
                        </div>
                      </div>

                      {/* Unique Viewers */}
                      <div className="metric-single-row">
                        <span className="metric-sublabel">Зрители</span>
                        <span className="metric-value-bold">{activeStats.uniqueViewersCount}</span>
                      </div>
                    </div>

                    <div className="stats-divider" />

                    {/* Section 2: Взаимодействия */}
                    <div className="stats-metric-card">
                      <div className="stats-metric-header">
                        <span className="metric-title">Взаимодействия</span>
                        <Info size={15} className="metric-info-icon" />
                      </div>
                      <div className="metric-main-stat-row">
                        <span className="metric-sublabel">Взаимодействия</span>
                        <span className="metric-value-bold">{activeStats.interactionsCount}</span>
                      </div>

                      <div className="metric-single-row">
                        <span className="metric-sublabel">Взаимодействия с историями</span>
                        <span className="metric-value-bold">{activeStats.storyInteractionsCount}</span>
                      </div>
                      <div className="metric-single-row indent-item">
                        <span className="metric-sublabel flex-icon-label">
                          <Heart size={14} /> Отметки "Нравится"
                        </span>
                        <span className="metric-value-bold">{activeStats.likesCount}</span>
                      </div>
                      <div className="metric-single-row indent-item">
                        <span className="metric-sublabel flex-icon-label">
                          <Share2 size={14} /> Поделились
                        </span>
                        <span className="metric-value-bold">{activeStats.sharesCount}</span>
                      </div>
                      <div className="metric-single-row indent-item">
                        <span className="metric-sublabel flex-icon-label">
                          <Send size={14} /> Ответы
                        </span>
                        <span className="metric-value-bold">{activeStats.repliesCount}</span>
                      </div>
                    </div>

                    <div className="stats-divider" />

                    {/* Section 3: Вовлеченные аккаунты */}
                    <div className="stats-metric-card">
                      <div className="metric-main-stat-row">
                        <span className="metric-title">Вовлеченные аккаунты</span>
                        <span className="metric-value-bold">{activeStats.engagedAccountsCount || '--'}</span>
                      </div>
                    </div>

                    <div className="stats-divider" />

                    {/* Section 4: Навигация */}
                    <div className="stats-metric-card">
                      <div className="stats-metric-header">
                        <span className="metric-title">Навигация</span>
                      </div>
                      <div className="metric-main-stat-row">
                        <span className="metric-sublabel">Навигация</span>
                        <span className="metric-value-bold">{activeStats.navigationTotal}</span>
                      </div>
                      <div className="metric-single-row">
                        <span className="metric-sublabel">Вперед</span>
                        <span className="metric-value-bold">{activeStats.navigationForward}</span>
                      </div>
                      <div className="metric-single-row">
                        <span className="metric-sublabel">Выходы</span>
                        <span className="metric-value-bold">{activeStats.navigationExits}</span>
                      </div>
                      <div className="metric-single-row">
                        <span className="metric-sublabel">Следующая история</span>
                        <span className="metric-value-bold">{activeStats.navigationNext}</span>
                      </div>
                    </div>

                    <div className="stats-divider" />

                    {/* Section 5: Профиль */}
                    <div className="stats-metric-card">
                      <div className="stats-metric-header">
                        <span className="metric-title">Профиль</span>
                        <Info size={15} className="metric-info-icon" />
                      </div>
                      <div className="metric-main-stat-row">
                        <span className="metric-sublabel">Действия в профиле</span>
                        <span className="metric-value-bold">{activeStats.profileActions}</span>
                      </div>
                      <div className="metric-single-row">
                        <span className="metric-sublabel">Посещения профиля</span>
                        <span className="metric-value-bold">{activeStats.profileVisits}</span>
                      </div>
                      <div className="metric-single-row">
                        <span className="metric-sublabel">Нажатия на внешнюю ссылку</span>
                        <span className="metric-value-bold">{activeStats.linkClicks}</span>
                      </div>
                      <div className="metric-single-row">
                        <span className="metric-sublabel">Нажатия на адрес компании</span>
                        <span className="metric-value-bold">{activeStats.companyAddressClicks}</span>
                      </div>
                      <div className="metric-single-row">
                        <span className="metric-sublabel">Подписки</span>
                        <span className="metric-value-bold">{activeStats.followsCount}</span>
                      </div>
                    </div>

                  </div>
                )}

                {/* Tab 2: Viewers List with Reactions */}
                {statsTab === 'viewers' && (
                  <div className="stats-panel-scrollable viewers-tab-content">
                    <div className="viewers-search-box">
                      <Search size={15} className="viewers-search-icon" />
                      <input 
                        type="text" 
                        placeholder="Поиск среди зрителей..." 
                        value={viewerSearchQuery}
                        onChange={e => setViewerSearchQuery(e.target.value)}
                        className="viewers-search-input"
                      />
                    </div>

                    <div className="viewers-list">
                      {filteredViewers.map(viewer => (
                        <div key={viewer.id} className="viewer-list-item">
                          <img 
                            src={viewer.avatar} 
                            alt={viewer.name} 
                            className="viewer-item-avatar"
                            onClick={() => {
                              navigate(`/profile/@${viewer.username}`);
                              handleClose();
                            }}
                          />
                          <div className="viewer-item-info">
                            <span 
                              className="viewer-item-name"
                              onClick={() => {
                                navigate(`/profile/@${viewer.username}`);
                                handleClose();
                              }}
                            >
                              {viewer.name}
                            </span>
                            <div className="viewer-item-meta">
                              <span className="viewer-username">@{viewer.username}</span>
                              {viewer.viewedAt && (
                                <>
                                  <span className="viewer-meta-dot">•</span>
                                  <span className="viewer-time">{viewer.viewedAt}</span>
                                </>
                              )}
                              {viewer.isFollower && (
                                <>
                                  <span className="viewer-meta-dot">•</span>
                                  <span className="viewer-follower-badge">Подписчик</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="viewer-item-actions">
                            <button 
                              type="button" 
                              className={`viewer-heart-btn ${viewer.liked ? 'active' : ''}`}
                              title={viewer.liked ? 'Поставил отметку "Нравится"' : 'Зритель'}
                            >
                              <Heart size={18} fill={viewer.liked ? '#ef4444' : 'none'} color={viewer.liked ? '#ef4444' : '#6b7280'} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {filteredViewers.length === 0 && (
                        <div className="viewers-empty">
                          Зрители не найдены
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* --- CONTEXT MENU MODAL (•••) (Screenshot 3) --- */}
          {isOptionsMenuOpen && (
            <div 
              className="insta-options-backdrop"
              onClick={(e) => {
                e.stopPropagation();
                setIsOptionsMenuOpen(false);
              }}
            >
              <div 
                className="insta-options-dialog" 
                onClick={e => e.stopPropagation()}
              >
                {/* 1. Удалить (Red text #ed4956) */}
                <button 
                  type="button" 
                  className="options-dialog-item text-danger"
                  onClick={handleDeleteCurrentStory}
                >
                  Удалить
                </button>

                {/* 2. Об аккаунте */}
                <button 
                  type="button" 
                  className="options-dialog-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOptionsMenuOpen(false);
                    handleAuthorClick(activeStory.user, e);
                  }}
                >
                  Об аккаунте
                </button>

                {/* 3. Статистика */}
                <button 
                  type="button" 
                  className="options-dialog-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOptionsMenuOpen(false);
                    setIsStatsOpen(true);
                    setStatsTab('overview');
                  }}
                >
                  Статистика
                </button>

                {/* 4. Продвигать историю */}
                <button 
                  type="button" 
                  className="options-dialog-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Продвижение истории активировано для целевой аудитории вашего региона 🚀');
                    setIsOptionsMenuOpen(false);
                  }}
                >
                  Продвигать историю
                </button>

                {/* 5. Отмена */}
                <button 
                  type="button" 
                  className="options-dialog-item item-cancel"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOptionsMenuOpen(false);
                  }}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onCreateStory={(newStory) => {
          if (onAddStory) {
            onAddStory(newStory);
          }
          setIsCreateStoryOpen(false);
          markStoryViewed(newStory.id);
        }}
      />
    </>
  );
}
