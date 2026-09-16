import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, ThumbsUp, ThumbsDown, 
  Share2, ChevronDown, ChevronUp, UserCheck, UserPlus, Check, 
  Film, Baby, MessageSquare, Send, Bookmark
} from 'lucide-react';
import type { Video, VideoComment } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import './VideoPlayer.css';

interface VideoPlayerProps {
  video?: Video | null;
  onSelectVideo?: (video: Video) => void;
  isKidsMode?: boolean;
}

export function VideoPlayer({ video, isKidsMode }: VideoPlayerProps) {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  // Playback & comments state
  const [isPlaying, setIsPlaying] = useState(false);
  const [comments, setComments] = useState<VideoComment[]>(() => video?.comments || []);
  const [newCommentText, setNewCommentText] = useState('');
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);

  // Update comments when video prop changes
  useEffect(() => {
    if (video) {
      setComments(video.comments || []);
      setLiked(false);
      setDisliked(false);
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [video?.id]);

  if (!video) {
    return (
      <div className="video-player-empty">
        <Film size={48} className="empty-film-icon" />
        <p>Выберите видео для просмотра</p>
      </div>
    );
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(true);
        });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleToggleLike = () => {
    if (liked) {
      setLiked(false);
    } else {
      setLiked(true);
      setDisliked(false);
    }
  };

  const handleToggleDislike = () => {
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      setLiked(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChannelClick = () => {
    navigate(`/channel/${video.channel.id === 'me' ? 'me' : video.channel.id}`);
  };

  // Add new comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const commentItem: VideoComment = {
      id: `c_${Date.now()}`,
      user: currentUser,
      text: newCommentText.trim(),
      timeAgo: 'Только что',
      likes: 0
    };

    setComments(prev => [commentItem, ...prev]);
    setNewCommentText('');
  };

  const toggleLikeComment = (commentId: string) => {
    setLikedCommentIds(prev => 
      prev.includes(commentId) ? prev.filter(id => id !== commentId) : [...prev, commentId]
    );
  };

  return (
    <div className={`video-player-container ${isKidsMode ? 'kids-theme' : ''}`}>
      {/* Video Screen with real HTML5 Video support */}
      <div className="video-wrapper">
        {video.videoUrl ? (
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnail}
            className="video-element"
            controls
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        ) : (
          <>
            <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
            <div className={`play-overlay ${isPlaying ? 'playing' : ''}`}>
              <button className="play-btn" onClick={togglePlay}>
                <Play size={44} fill="currentColor" />
              </button>
            </div>
            {isPlaying && (
              <div className="video-playing-indicator">
                <span className="live-pill">Демо-проигрывание видеопотока</span>
              </div>
            )}
          </>
        )}

        {/* Video Mode Badges */}
        {video.isKids && (
          <div className="video-player-kids-badge">
            <Baby size={15} />
            <span>Детский режим • {video.ageRating || '0+'}</span>
          </div>
        )}
        {video.isMovie && (
          <div className="video-player-movie-badge">
            <Film size={15} />
            <span>Фильм • {video.releaseYear} • Рейтинг: ★ {video.rating}</span>
          </div>
        )}
      </div>

      <div className="video-info">
        {/* Title and Badges */}
        <div className="video-title-header">
          <h1 className="video-title">{video.title}</h1>
          {video.rating && (
            <span className="movie-rating-chip" title="Рейтинг фильма">
              ★ {video.rating}
            </span>
          )}
        </div>

        {/* Metadata row: Genre, Release Year, Age Rating */}
        {(video.genre || video.ageRating) && (
          <div className="video-genre-row">
            {video.genre && <span className="genre-tag">{video.genre}</span>}
            {video.ageRating && <span className="age-rating-tag">{video.ageRating}</span>}
            {video.category && <span className="category-tag">{video.category}</span>}
          </div>
        )}

        <div className="video-stats-row">
          {/* Channel Info */}
          <div className="video-channel-info" onClick={handleChannelClick} title="Перейти на канал">
            <img src={video.channel.avatar} alt={video.channel.name} className="channel-avatar" />
            <div className="channel-text">
              <span className="channel-name">{video.channel.name}</span>
              <span className="channel-subs">{(video.channel.followersCount || 12400).toLocaleString('ru-RU')} подписчиков</span>
            </div>
            <button
              className={`channel-sub-btn ${isSubscribed ? 'subscribed' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsSubscribed(!isSubscribed);
              }}
            >
              {isSubscribed ? (
                <>
                  <UserCheck size={15} /> Вы подписаны
                </>
              ) : (
                <>
                  <UserPlus size={15} /> Подписаться
                </>
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="video-actions">
            <div className="like-dislike-group">
              <button 
                className={`action-btn-pill ${liked ? 'active' : ''}`} 
                onClick={handleToggleLike}
              >
                <ThumbsUp size={16} fill={liked ? 'currentColor' : 'none'} />
                <span>{liked ? (video.likesCount || 1400) + 1 : (video.likesCount || 1400)}</span>
              </button>
              <div className="pill-divider" />
              <button 
                className={`action-btn-pill ${disliked ? 'active' : ''}`} 
                onClick={handleToggleDislike}
              >
                <ThumbsDown size={16} fill={disliked ? 'currentColor' : 'none'} />
              </button>
            </div>

            <button 
              className={`action-btn-pill ${isSaved ? 'active' : ''}`}
              onClick={() => setIsSaved(!isSaved)}
              title="Сохранить в плейлист"
            >
              <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
              <span>{isSaved ? 'В сохранённых' : 'Сохранить'}</span>
            </button>

            <button className="action-btn-pill" onClick={handleShare}>
              {copied ? <Check size={16} color="var(--color-success)" /> : <Share2 size={16} />}
              <span>{copied ? 'Скопировано!' : 'Поделиться'}</span>
            </button>
          </div>
        </div>

        {/* Description Box */}
        <div className="video-description-box">
          <div className="video-meta">
            <span className="meta-views">{video.views}</span>
            <span className="meta-dot">•</span>
            <span className="meta-time">{video.timeAgo}</span>
            {video.releaseYear && (
              <>
                <span className="meta-dot">•</span>
                <span className="meta-year">{video.releaseYear} год</span>
              </>
            )}
          </div>

          <div className={`video-desc-text ${showFullDesc ? 'expanded' : ''}`}>
            {video.description}
          </div>

          <button className="toggle-desc-btn" onClick={() => setShowFullDesc(!showFullDesc)}>
            {showFullDesc ? (
              <>Свернуть описание <ChevronUp size={15} /></>
            ) : (
              <>Развернуть описание <ChevronDown size={15} /></>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* COMMENTS SECTION (YOUTUBE STYLE) */}
        {/* ========================================================================= */}
        <div className="video-comments-section">
          <div className="comments-header">
            <h3 className="comments-count">
              <MessageSquare size={18} />
              <span>Комментарии ({comments.length})</span>
            </h3>
          </div>

          {/* New Comment Input Form */}
          <form className="add-comment-form" onSubmit={handleAddComment}>
            <img 
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'} 
              alt="Avatar" 
              className="comment-user-avatar"
            />
            <div className="comment-input-wrap">
              <input
                type="text"
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                placeholder="Оставьте свой комментарий к этому видео..."
                className="comment-text-input"
              />
              <button 
                type="submit" 
                className="btn-send-comment"
                disabled={!newCommentText.trim()}
              >
                <Send size={15} />
                <span>Отправить</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments-yet">
                <p>Здесь пока нет комментариев. Будьте первым, кто поделится мнением!</p>
              </div>
            ) : (
              comments.map(c => {
                const isCommentLiked = likedCommentIds.includes(c.id);
                return (
                  <div key={c.id} className="comment-item">
                    <img src={c.user.avatar} alt={c.user.name} className="comment-author-avatar" />
                    <div className="comment-body">
                      <div className="comment-author-line">
                        <span className="comment-author-name">{c.user.name}</span>
                        <span className="comment-time">{c.timeAgo}</span>
                      </div>
                      <p className="comment-content">{c.text}</p>
                      
                      <div className="comment-actions-bar">
                        <button 
                          type="button" 
                          className={`btn-like-comment ${isCommentLiked ? 'active' : ''}`}
                          onClick={() => toggleLikeComment(c.id)}
                        >
                          <ThumbsUp size={13} fill={isCommentLiked ? 'currentColor' : 'none'} />
                          <span>{isCommentLiked ? (c.likes || 0) + 1 : (c.likes || 0)}</span>
                        </button>
                        <button type="button" className="btn-reply-comment">
                          Ответить
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
