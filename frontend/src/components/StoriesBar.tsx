import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, X, Heart, Send, ChevronLeft, ChevronRight, 
  Pause, Play, Sparkles, Wand2 
} from 'lucide-react';
import { type Story, type User } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { CreateStoryModal, STORY_FILTERS } from './CreateStoryModal';
import './StoriesBar.css';

interface StoriesBarProps {
  stories: Story[];
  onAddStory?: (newStory: Story) => void;
}

export function StoriesBar({ stories, onAddStory }: StoriesBarProps) {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  
  // Active story viewer state
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('new_age_viewed_stories');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  // Mark stories viewed
  const markStoryViewed = (storyId: string) => {
    setViewedStoryIds(prev => {
      const next = new Set(prev);
      next.add(storyId);
      localStorage.setItem('new_age_viewed_stories', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleOpenStory = (index: number) => {
    setActiveStoryIndex(index);
    setProgress(0);
    setIsPaused(false);
    setReplyText('');
    const story = stories[index];
    if (story) {
      markStoryViewed(story.id);
    }
  };

  const handleClose = () => {
    setActiveStoryIndex(null);
    setProgress(0);
    setIsPaused(false);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      const prevIdx = activeStoryIndex - 1;
      setActiveStoryIndex(prevIdx);
      setProgress(0);
      markStoryViewed(stories[prevIdx].id);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      const nextIdx = activeStoryIndex + 1;
      setActiveStoryIndex(nextIdx);
      setProgress(0);
      markStoryViewed(stories[nextIdx].id);
    } else {
      handleClose();
    }
  };

  // 5-second automatic progression timer like Instagram
  useEffect(() => {
    if (activeStoryIndex === null || isPaused) return;

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
  }, [activeStoryIndex, isPaused, stories.length]);

  // Keyboard navigation (Escape, Left, Right, Space to pause)
  useEffect(() => {
    if (activeStoryIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        setIsPaused(p => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryIndex, stories.length]);

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

  return (
    <>
      {/* Instagram Story Horizontal Tray */}
      <div className="instagram-stories-tray">
        <div className="stories-scroll-track">
          
          {/* 1. Add Story Bubble ("Ваша история" / "+") */}
          <div 
            className="insta-story-item own-story-bubble"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('register');
              } else {
                setIsCreateStoryOpen(true);
              }
            }}
          >
            <div className="insta-avatar-ring own-ring">
              <img 
                src={currentUser.avatar} 
                alt="Ваша история" 
                className="insta-avatar-img" 
              />
              <div className="insta-plus-badge">
                <Plus size={14} strokeWidth={3} />
              </div>
            </div>
            <span className="insta-story-username">Ваша история</span>
          </div>

          {/* 2. Other Users' Stories with Instagram Gradient Rings */}
          {stories.map((story, index) => {
            const isViewed = viewedStoryIds.has(story.id) || story.viewed;
            const isLiveStory = story.isLive;
            return (
              <div 
                key={story.id} 
                className={`insta-story-item ${isLiveStory ? 'live-story' : (isViewed ? 'viewed' : 'unviewed')}`}
                onClick={() => handleOpenStory(index)}
              >
                <div className={`insta-avatar-ring ${isLiveStory ? 'ring-live' : (isViewed ? 'ring-viewed' : 'ring-gradient')}`}>
                  <div className="insta-avatar-inner">
                    <img 
                      src={story.user.avatar} 
                      alt={story.user.name} 
                      className="insta-avatar-img" 
                    />
                    {story.user.online && !isLiveStory && <span className="insta-online-indicator" />}
                  </div>
                  {isLiveStory && (
                    <span className="insta-live-tag-badge">LIVE</span>
                  )}
                </div>
                <span className="insta-story-username">{story.user.name.split(' ')[0]}</span>
              </div>
            );
          })}

        </div>
      </div>

      {/* Fullscreen Instagram Story Viewer Modal */}
      {activeStory && (
        <div 
          className="insta-viewer-overlay"
          onClick={handleClose}
        >
          {/* Desktop Navigation Arrows */}
          <button 
            type="button"
            className="insta-nav-arrow arrow-left" 
            onClick={handlePrev}
            disabled={activeStoryIndex === 0}
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

          {/* Story Container (Phone Dimensions 9:16) */}
          <div 
            className="insta-story-card" 
            onClick={e => e.stopPropagation()}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Multi-segment Progress Bars */}
            <div className="insta-progress-row">
              {stories.map((s, idx) => {
                let barWidth = '0%';
                if (activeStoryIndex !== null) {
                  if (idx < activeStoryIndex) barWidth = '100%';
                  else if (idx === activeStoryIndex) barWidth = `${progress}%`;
                }

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
                    src={activeStory.user.avatar} 
                    alt={activeStory.user.name} 
                    className="insta-header-avatar" 
                  />
                  <div className="insta-header-text">
                    <div className="insta-header-title-row">
                      <span className="insta-header-name">{activeStory.user.name}</span>
                      {activeStory.isLive && (
                        <span className="viewer-live-badge">
                          <span className="live-red-dot" /> LIVE
                        </span>
                      )}
                    </div>
                    <span className="insta-header-time">
                      {activeStory.isLive ? `${activeStory.liveViewers || 14} зрителей` : (activeStory.timestamp || '2 ч')}
                    </span>
                  </div>
                </div>

                {/* Filter and Mask Badge & Controls */}
                <div className="insta-header-actions">
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
                  <button 
                    type="button" 
                    className="insta-header-icon-btn" 
                    onClick={() => setIsPaused(p => !p)}
                    title={isPaused ? 'Продолжить' : 'Пауза'}
                  >
                    {isPaused ? <Play size={18} /> : <Pause size={18} />}
                  </button>
                </div>
              </div>

              {/* Story Visual Content (Image or Video) */}
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
                    {/* Video Player if recorded story */}
                    {activeStory.videoUrl ? (
                      <video
                        src={activeStory.videoUrl}
                        autoPlay
                        loop
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

                    {/* AR Mask Overlay in Viewer */}
                    {activeStory.mask && (
                      <div className="viewer-ar-mask-overlay">
                        {activeStory.mask.includes('очки') && <span className="mask-element ar-glasses">🕶️</span>}
                        {activeStory.mask.includes('корона') && <span className="mask-element ar-crown">👑</span>}
                        {activeStory.mask.includes('ушки') && <span className="mask-element ar-cat-ears">🐱</span>}
                        {activeStory.mask.includes('Нимб') && <span className="mask-element ar-halo">😇</span>}
                        {activeStory.mask.includes('визор') && <span className="mask-element ar-visor">🥽</span>}
                        {activeStory.mask.includes('Сияние') && <span className="mask-element ar-sparkles">✨</span>}
                      </div>
                    )}

                    {/* Story Overlay Caption / Text */}
                    {activeStory.text && (
                      <div className={`insta-story-text-badge pos-${activeStory.textPosition || 'center'}`}>
                        <p>{activeStory.text}</p>
                      </div>
                    )}

                    {/* Interactive Left/Right Tap Areas */}
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
