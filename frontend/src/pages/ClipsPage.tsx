import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, 
  Play, Pause, Plus, Music, ChevronUp, ChevronDown, X, Send, Smile,
  Radio, Users, Sparkles, Flame
} from 'lucide-react';
import { type Clip, type ClipComment } from '../data/mock';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './ClipsPage.css';

type ClipTab = 'all' | 'live' | 'trending';

export function ClipsPage() {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.clips.list().then((data) => {
      if (mounted) {
        const saved = localStorage.getItem('newage_clips_state');
        let finalClips = data;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const ids = new Set(parsed.map((c: Clip) => c.id));
            const missing = data.filter((c: Clip) => !ids.has(c.id));
            finalClips = [...missing, ...parsed];
          } catch (e) {
            console.error('Failed to parse saved clips', e);
          }
        }
        setClips(finalClips);
        setIsLoading(false);
      }
    }).catch(err => {
      console.warn('Failed to load clips', err);
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const [activeTab, setActiveTab] = useState<ClipTab>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showPlayAnim, setShowPlayAnim] = useState(false);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [activeClipForComments, setActiveClipForComments] = useState<Clip | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [followedAuthors, setFollowedAuthors] = useState<Record<string, boolean>>({
    'u2': true,
  });

  const feedRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    localStorage.setItem('newage_clips_state', JSON.stringify(clips));
  }, [clips]);

  useEffect(() => {
    const currentClip = clips[activeIndex];
    if (!currentClip) return;

    Object.keys(videoRefs.current).forEach((clipId) => {
      const vid = videoRefs.current[clipId];
      if (!vid) return;

      if (clipId === currentClip.id) {
        vid.muted = isMuted;
        if (isPlaying) {
          vid.play().catch(() => {
            vid.muted = true;
            setIsMuted(true);
            vid.play().catch((err) => console.log('Autoplay error', err));
          });
        } else {
          vid.pause();
        }
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, [activeIndex, isPlaying, isMuted, clips]);

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    const container = feedRef.current;
    const scrollPosition = container.scrollTop;
    const itemHeight = container.clientHeight;
    if (itemHeight === 0) return;

    const newIndex = Math.round(scrollPosition / itemHeight);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < clips.length) {
      setActiveIndex(newIndex);
      setIsPlaying(true);
    }
  }, [activeIndex, clips.length]);

  const scrollToClip = (index: number) => {
    if (!feedRef.current || index < 0 || index >= clips.length) return;
    const itemHeight = feedRef.current.clientHeight;
    feedRef.current.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth'
    });
  };

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
    setShowPlayAnim(true);
    setTimeout(() => setShowPlayAnim(false), 700);
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      const currentClip = clips[activeIndex];
      if (currentClip && videoRefs.current[currentClip.id]) {
        videoRefs.current[currentClip.id]!.muted = next;
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (commentsDrawerOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToClip(activeIndex + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToClip(activeIndex - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, commentsDrawerOpen, isPlaying, isMuted]);

  const handleLike = (clipId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        const liked = !c.isLiked;
        return {
          ...c,
          isLiked: liked,
          likesCount: liked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1)
        };
      }
      return c;
    }));
  };

  const handleSave = (clipId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setClips(prev => prev.map(c => {
      if (c.id === clipId) {
        return {
          ...c,
          isSaved: !c.isSaved
        };
      }
      return c;
    }));
  };

  const handleToggleFollow = (userId: string) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    setFollowedAuthors(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleShare = (clip: Clip) => {
    const url = window.location.origin + '/clips?id=' + clip.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert('Ссылка на клип скопирована!');
    }
  };

  const openComments = (clip: Clip) => {
    setActiveClipForComments(clip);
    setCommentsDrawerOpen(true);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !activeClipForComments) return;
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const newComment: ClipComment = {
      id: 'cc_' + Date.now(),
      user: currentUser,
      text: newCommentText.trim(),
      timeAgo: 'только что',
      likes: 0
    };

    setClips(prev => prev.map(c => {
      if (c.id === activeClipForComments.id) {
        const updatedComments = [newComment, ...(c.comments || [])];
        const updatedClip = {
          ...c,
          comments: updatedComments,
          commentsCount: c.commentsCount + 1
        };
        setActiveClipForComments(updatedClip);
        return updatedClip;
      }
      return c;
    }));

    setNewCommentText('');
  };

  const handleLikeComment = (commentId: string) => {
    if (!activeClipForComments) return;
    setClips(prev => prev.map(c => {
      if (c.id === activeClipForComments.id && c.comments) {
        const updatedComments = c.comments.map(cm => {
          if (cm.id === commentId) {
            return { ...cm, likes: (cm.likes || 0) + 1 };
          }
          return cm;
        });
        const updatedClip = { ...c, comments: updatedComments };
        setActiveClipForComments(updatedClip);
        return updatedClip;
      }
      return c;
    }));
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const displayedClips = clips.filter(c => {
    if (activeTab === 'live') return c.isLive;
    if (activeTab === 'trending') return c.likesCount > 10000;
    return true;
  });

  if (isLoading) {
    return <div style={{ padding: '20px', color: '#fff' }}>Загрузка...</div>;
  }

  return (
    <div className="clips-page-container">
      {/* Category Tab Selector (Все / LIVE 🔴 / Тренды) */}
      <div className="clips-category-nav-bar">
        <button 
          type="button" 
          className={`clips-cat-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => { setActiveTab('all'); setActiveIndex(0); scrollToClip(0); }}
        >
          <Sparkles size={14} />
          <span>Все клипы</span>
        </button>
        <button 
          type="button" 
          className={`clips-cat-tab live-tab ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => { setActiveTab('live'); setActiveIndex(0); scrollToClip(0); }}
        >
          <Radio size={14} className="clip-live-pulse-icon" />
          <span>Прямой эфир • LIVE</span>
          <span className="clips-live-dot" />
        </button>
        <button 
          type="button" 
          className={`clips-cat-tab ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => { setActiveTab('trending'); setActiveIndex(0); scrollToClip(0); }}
        >
          <Flame size={14} />
          <span>В тренде</span>
        </button>
      </div>

      <div className="clips-feed-wrapper">
        <div className="clip-nav-arrows">
          <button 
            type="button"
            className="clip-arrow-btn" 
            onClick={() => scrollToClip(activeIndex - 1)}
            disabled={activeIndex === 0}
            title="Предыдущий клип"
          >
            <ChevronUp size={22} />
          </button>
          <button 
            type="button"
            className="clip-arrow-btn" 
            onClick={() => scrollToClip(activeIndex + 1)}
            disabled={activeIndex === displayedClips.length - 1}
            title="Следующий клип"
          >
            <ChevronDown size={22} />
          </button>
        </div>

        <div className="clips-feed" ref={feedRef} onScroll={handleScroll}>
          {displayedClips.map((clip, index) => {
            const isCurrent = index === activeIndex;
            const isFollowed = followedAuthors[clip.user.id];
            const isCaptionExpanded = expandedCaptions[clip.id];

            return (
              <div key={clip.id} className="clip-item-card">
                {/* Central Video Container */}
                <div className="clip-video-wrapper">
                  {/* Top Floating Badge */}
                  <div className="clip-top-bar">
                    {clip.isLive ? (
                      <div className="clip-live-brand-tag">
                        <span className="clip-live-flashing-dot" />
                        <span className="clip-live-text">В ЭФИРЕ • LIVE</span>
                        {clip.viewersCount && (
                          <span className="clip-live-viewers">
                            <Users size={12} /> {clip.viewersCount.toLocaleString('ru-RU')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="clip-brand-tag">
                        <span className="clip-brand-dot" />
                        <span>Reels • New Age</span>
                      </div>
                    )}
                    <Link to="/editor" className="clip-create-btn" title="Снять свой ролик">
                      <Plus size={15} />
                      <span>Создать</span>
                    </Link>
                  </div>

                  {/* Video Player */}
                  <video
                    ref={el => { videoRefs.current[clip.id] = el; }}
                    className="clip-video-element"
                    src={clip.videoUrl}
                    poster={clip.poster}
                    loop
                    playsInline
                    muted={isMuted}
                    onClick={togglePlayPause}
                  />

                  {/* Big Play/Pause Center Indicator */}
                  {isCurrent && showPlayAnim && (
                    <div className="clip-center-play-indicator">
                      {isPlaying ? <Play size={36} fill="#fff" /> : <Pause size={36} fill="#fff" />}
                    </div>
                  )}

                  {/* Aesthetic Gothic / Spiritual Subtitle Overlay like in screenshot */}
                  {clip.overlayTitle && (
                    <div className="clip-overlay-title-banner">
                      <div className="clip-overlay-title-text">{clip.overlayTitle}</div>
                    </div>
                  )}

                  {/* In-Video Mute / Unmute Button (Bottom Right) */}
                  <button 
                    type="button"
                    className="clip-invideo-mute-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMute();
                    }}
                    title={isMuted ? 'Включить звук' : 'Выключить звук'}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  {/* Bottom Info inside Video (Author, Follow, AI badge, Caption, Music) */}
                  <div className="clip-bottom-info">
                    {/* Author Row */}
                    <div className="clip-author-row">
                      <Link to="/profile" className="clip-author-avatar-wrap">
                        <img 
                          src={clip.user.avatar} 
                          alt={clip.user.name} 
                          className="clip-author-avatar" 
                        />
                      </Link>
                      <div className="clip-author-info-col">
                        <div className="clip-author-names-line">
                          <Link to="/profile" className="clip-author-username">
                            {clip.user.name}
                          </Link>
                          <span className="clip-dot-sep">•</span>
                          {clip.user.id !== currentUser.id && (
                            <button 
                              type="button"
                              className={`clip-follow-btn ${isFollowed ? 'following' : ''}`}
                              onClick={() => handleToggleFollow(clip.user.id)}
                            >
                              {isFollowed ? 'Подписки' : 'Подписаться'}
                            </button>
                          )}
                        </div>

                        {/* AI Generated Content badge from screenshot */}
                        {clip.isAiGenerated && (
                          <div className="clip-ai-badge-pill" title="Профиль, сгенерированный ИИ • ИИ-контент">
                            <span className="clip-ai-sparkle">✨</span>
                            <span>Профиль, сгенерированный ИИ • ИИ-контент</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Caption / Description with "... еще" */}
                    <div className={`clip-caption-wrap ${isCaptionExpanded ? 'expanded' : ''}`}>
                      <p className="clip-caption-text">
                        <span className="clip-caption-author">{clip.user.name}</span>{' '}
                        {clip.caption}
                      </p>
                      {clip.caption.length > 60 && (
                        <button 
                          type="button"
                          className="clip-more-toggle"
                          onClick={() => setExpandedCaptions(p => ({ ...p, [clip.id]: !p[clip.id] }))}
                        >
                          {isCaptionExpanded ? 'Свернуть' : '... ещё'}
                        </button>
                      )}
                    </div>

                    {/* Music track ticker row */}
                    <div className="clip-music-row">
                      <Music size={13} className="clip-music-icon" />
                      <div className="clip-music-ticker-wrap">
                        <span className="clip-music-name">
                          {clip.musicTitle || 'Оригинальный звук'} • {clip.musicAuthor || clip.user.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Action Column (Outside Video on Desktop, exactly like Instagram Reels) */}
                <div className="clip-right-actions-column">
                  {/* Like */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className={`clip-action-btn ${clip.isLiked ? 'liked' : ''}`}
                      onClick={() => handleLike(clip.id)}
                      title={clip.isLiked ? 'Нравится' : 'Поставить лайк'}
                    >
                      <Heart size={24} fill={clip.isLiked ? '#ef4444' : 'none'} color={clip.isLiked ? '#ef4444' : '#fff'} />
                    </button>
                    <span className="clip-action-count">{formatCount(clip.likesCount)}</span>
                  </div>

                  {/* Comment */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className="clip-action-btn"
                      onClick={() => openComments(clip)}
                      title="Комментарии"
                    >
                      <MessageCircle size={24} color="#fff" />
                    </button>
                    <span className="clip-action-count">{formatCount(clip.commentsCount)}</span>
                  </div>

                  {/* Share / Repost */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className="clip-action-btn"
                      onClick={() => handleShare(clip)}
                      title="Поделиться"
                    >
                      <Share2 size={23} color="#fff" />
                    </button>
                    <span className="clip-action-count">{clip.sharesCount || 56}</span>
                  </div>

                  {/* Save / Bookmark */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className={`clip-action-btn ${clip.isSaved ? 'saved' : ''}`}
                      onClick={() => handleSave(clip.id)}
                      title={clip.isSaved ? 'Сохранено' : 'Сохранить'}
                    >
                      <Bookmark size={24} fill={clip.isSaved ? '#fff' : 'none'} color="#fff" />
                    </button>
                  </div>

                  {/* More Options (...) */}
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className="clip-action-btn"
                      onClick={() => handleShare(clip)}
                      title="Параметры"
                    >
                      <span className="clip-dots-icon">•••</span>
                    </button>
                  </div>

                  {/* Audio Track Thumbnail (Spinning square or circle with album art) */}
                  <div 
                    className="clip-sound-cover-btn"
                    onClick={toggleMute}
                    title={clip.musicTitle || 'Аудиодорожка'}
                  >
                    <img 
                      src={clip.audioTrackArt || clip.user.avatar || clip.poster} 
                      alt="Audio Art" 
                      className={`clip-audio-art-thumb ${!isPlaying ? 'paused' : ''}`} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {commentsDrawerOpen && activeClipForComments && (
        <div className="clip-comments-drawer-overlay" onClick={() => setCommentsDrawerOpen(false)}>
          <div className="clip-comments-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="clip-comments-header">
              <button 
                type="button"
                className="clip-comments-close" 
                onClick={() => setCommentsDrawerOpen(false)}
                title="Закрыть комментарии"
              >
                <X size={18} />
              </button>
              <span className="clip-comments-title">
                Комментарии
              </span>
              <div style={{ width: 24 }} />
            </div>

            <div className="clip-comments-list">
              {activeClipForComments.comments && activeClipForComments.comments.length > 0 ? (
                activeClipForComments.comments.map((c) => (
                  <div key={c.id} className="clip-comment-item">
                    <img 
                      src={c.user.avatar} 
                      alt={c.user.name} 
                      className="clip-comment-avatar" 
                    />
                    <div className="clip-comment-body">
                      <div className="clip-comment-line">
                        <span className="clip-comment-author">{c.user.username || c.user.name}</span>
                        <span className="clip-comment-time">{c.timeAgo}</span>
                      </div>
                      <p className="clip-comment-text">{c.text}</p>
                      
                      <div className="clip-comment-subactions">
                        <button type="button" className="comment-subaction-link" onClick={() => setNewCommentText(`@${c.user.username || c.user.name} `)}>
                          Ответить
                        </button>
                        <button type="button" className="comment-subaction-link">
                          Показать перевод
                        </button>
                      </div>

                      <div className="comment-replies-row">
                        <span className="comment-replies-line" />
                        <span className="comment-replies-text">Смотреть все ответы (1)</span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="clip-comment-like-btn"
                      onClick={() => handleLikeComment(c.id)}
                      title="Нравится"
                    >
                      <Heart size={14} fill={(c.likes || 0) > 0 ? '#ef4444' : 'none'} color={(c.likes || 0) > 0 ? '#ef4444' : '#8e8e8e'} />
                      {(c.likes || 0) > 0 && <span className="comment-like-count">{c.likes}</span>}
                    </button>
                  </div>
                ))
              ) : (
                <div className="clip-comments-empty">
                  Пока нет комментариев. Будьте первыми!
                </div>
              )}
            </div>

            <form className="clip-comment-input-form" onSubmit={handleAddComment}>
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="clip-comment-my-avatar"
              />
              <div className="clip-comment-input-wrap">
                <input 
                  type="text" 
                  className="clip-comment-input"
                  placeholder={isAuthenticated ? 'Добавьте комментарий...' : 'Войдите, чтобы комментировать'}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  disabled={!isAuthenticated}
                />
                <button 
                  type="button" 
                  className="clip-comment-emoji-btn"
                  title="Эмодзи"
                  onClick={() => setNewCommentText(prev => prev + '❤️')}
                >
                  <Smile size={18} />
                </button>
              </div>
              {newCommentText.trim() && (
                <button 
                  type="submit" 
                  className="clip-comment-send-btn"
                  disabled={!isAuthenticated || !newCommentText.trim()}
                  title="Опубликовать"
                >
                  <Send size={15} />
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

