import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, 
  Play, Pause, Plus, Music, ChevronUp, ChevronDown, X, Send, 
  Check
} from 'lucide-react';
import { initialClips } from '../data/mock';
import type { Clip, ClipComment } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import './ClipsPage.css';

export function ClipsPage() {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [clips, setClips] = useState<Clip[]>(() => {
    const saved = localStorage.getItem('newage_clips_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved clips', e);
      }
    }
    return initialClips;
  });

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

  return (
    <div className="clips-page-container">
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
            disabled={activeIndex === clips.length - 1}
            title="Следующий клип"
          >
            <ChevronDown size={22} />
          </button>
        </div>

        <div className="clips-feed" ref={feedRef} onScroll={handleScroll}>
          {clips.map((clip, index) => {
            const isCurrent = index === activeIndex;
            const isFollowed = followedAuthors[clip.user.id];
            const isCaptionExpanded = expandedCaptions[clip.id];

            return (
              <div key={clip.id} className="clip-item-card">
                <div className="clip-top-bar">
                  <div className="clip-brand-tag">
                    <span className="clip-brand-dot" />
                    <span>Клипы • New Age</span>
                  </div>
                  <Link to="/editor" className="clip-create-btn" title="Снять свой клип">
                    <Plus size={15} />
                    <span>Создать клип</span>
                  </Link>
                </div>

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

                {isCurrent && showPlayAnim && (
                  <div className="clip-center-play-indicator">
                    {isPlaying ? <Play size={36} fill="#fff" /> : <Pause size={36} fill="#fff" />}
                  </div>
                )}

                <div className="clip-right-actions">
                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className={`clip-action-btn ${clip.isLiked ? 'liked' : ''}`}
                      onClick={() => handleLike(clip.id)}
                      title={clip.isLiked ? 'Нравится' : 'Поставить лайк'}
                    >
                      <Heart size={22} fill={clip.isLiked ? '#ef4444' : 'none'} />
                    </button>
                    <span className="clip-action-count">{formatCount(clip.likesCount)}</span>
                  </div>

                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className="clip-action-btn"
                      onClick={() => openComments(clip)}
                      title="Комментарии"
                    >
                      <MessageCircle size={22} />
                    </button>
                    <span className="clip-action-count">{formatCount(clip.commentsCount)}</span>
                  </div>

                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className={`clip-action-btn ${clip.isSaved ? 'saved' : ''}`}
                      onClick={() => handleSave(clip.id)}
                      title={clip.isSaved ? 'Сохранено' : 'Сохранить клип'}
                    >
                      <Bookmark size={22} fill={clip.isSaved ? '#eab308' : 'none'} />
                    </button>
                    <span className="clip-action-count">В закладки</span>
                  </div>

                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className="clip-action-btn"
                      onClick={() => handleShare(clip)}
                      title="Поделиться"
                    >
                      <Share2 size={21} />
                    </button>
                    <span className="clip-action-count">{formatCount(clip.sharesCount)}</span>
                  </div>

                  <div className="clip-action-item">
                    <button 
                      type="button"
                      className="clip-action-btn"
                      onClick={toggleMute}
                      title={isMuted ? 'Включить звук' : 'Выключить звук'}
                    >
                      {isMuted ? <VolumeX size={21} /> : <Volume2 size={21} />}
                    </button>
                  </div>

                  <div 
                    className={`clip-sound-disc ${!isPlaying ? 'paused' : ''}`}
                    onClick={toggleMute}
                    title={clip.musicTitle || 'Музыкальная дорожка'}
                  >
                    <img 
                      src={clip.user.avatar || clip.poster} 
                      alt="Disc cover" 
                      className="clip-disc-art" 
                    />
                  </div>
                </div>

                <div className="clip-bottom-info">
                  <div className="clip-author-row">
                    <Link to="/profile" className="clip-author-avatar-wrap">
                      <img 
                        src={clip.user.avatar} 
                        alt={clip.user.name} 
                        className="clip-author-avatar" 
                      />
                    </Link>
                    <div className="clip-author-names">
                      <div className="clip-author-display-name">
                        <Link to="/profile" style={{ color: '#fff', textDecoration: 'none' }}>
                          {clip.user.name}
                        </Link>
                        {clip.user.consciousnessLevel && (
                          <span className="clip-level-badge">
                            {clip.user.consciousnessLevel} кл. • {clip.user.consciousnessTitle || 'Осознанность'}
                          </span>
                        )}
                      </div>
                    </div>
                    {clip.user.id !== currentUser.id && (
                      <button 
                        type="button"
                        className={`clip-follow-btn ${isFollowed ? 'following' : ''}`}
                        onClick={() => handleToggleFollow(clip.user.id)}
                      >
                        {isFollowed ? (
                          <>
                            <Check size={13} style={{ display: 'inline', marginRight: 4 }} />
                            Вы подписаны
                          </>
                        ) : (
                          '+ Подписаться'
                        )}
                      </button>
                    )}
                  </div>

                  <div className={`clip-caption-wrap ${isCaptionExpanded ? 'expanded' : ''}`}>
                    <p className="clip-caption-text">
                      {clip.caption}
                    </p>
                    {clip.caption.length > 70 && (
                      <button 
                        type="button"
                        className="clip-more-toggle"
                        onClick={() => setExpandedCaptions(p => ({ ...p, [clip.id]: !p[clip.id] }))}
                      >
                        {isCaptionExpanded ? 'Свернуть' : 'ещё...'}
                      </button>
                    )}
                    {clip.tags && clip.tags.length > 0 && (
                      <div className="clip-tags-row">
                        {clip.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="clip-tag-item">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="clip-music-row">
                    <Music size={14} className="clip-music-icon" />
                    <span className="clip-music-name">
                      {clip.musicTitle || 'Оригинальный звук'} • {clip.musicAuthor || clip.user.name}
                    </span>
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
              <span className="clip-comments-title">
                Комментарии ({activeClipForComments.comments?.length || 0})
              </span>
              <button 
                type="button"
                className="clip-comments-close" 
                onClick={() => setCommentsDrawerOpen(false)}
              >
                <X size={20} />
              </button>
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
                      <span className="clip-comment-author">{c.user.name}</span>
                      <p className="clip-comment-text">{c.text}</p>
                      <div className="clip-comment-footer">
                        <span>{c.timeAgo}</span>
                        <button 
                          type="button"
                          className="clip-comment-like-btn"
                          onClick={() => handleLikeComment(c.id)}
                        >
                          <Heart size={11} />
                          <span>{c.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="clip-comments-empty">
                  Пока нет комментариев. Будьте первыми!
                </div>
              )}
            </div>

            <form className="clip-comment-input-form" onSubmit={handleAddComment}>
              <input 
                type="text" 
                className="clip-comment-input"
                placeholder={isAuthenticated ? 'Оставить комментарий...' : 'Войдите, чтобы комментировать'}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                disabled={!isAuthenticated}
              />
              <button 
                type="submit" 
                className="clip-comment-send-btn"
                disabled={!isAuthenticated || !newCommentText.trim()}
                title="Отправить комментарий"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

