import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ThumbsUp, ThumbsDown, Share2, ChevronDown, ChevronUp, UserCheck, UserPlus, Check } from 'lucide-react';
import type { Video } from '../data/mock';
import './VideoPlayer.css';

interface VideoPlayerProps {
  video?: Video | null;
}

export function VideoPlayer({ video }: VideoPlayerProps) {
  const navigate = useNavigate();
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!video) {
    return (
      <div className="video-player-empty">
        <p>Выберите видео для просмотра</p>
      </div>
    );
  }

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

  return (
    <div className="video-player-container">
      {/* Video Screen */}
      <div className="video-wrapper">
        <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
        
        <div className={`play-overlay ${isPlaying ? 'playing' : ''}`}>
          <button className="play-btn" onClick={() => setIsPlaying(!isPlaying)}>
            <Play size={48} fill="currentColor" />
          </button>
        </div>

        {isPlaying && (
          <div className="video-playing-indicator">
            <span className="live-pill">Демо-проигрывание видеопотока</span>
          </div>
        )}
      </div>

      <div className="video-info">
        <h1 className="video-title">{video.title}</h1>

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
                <ThumbsUp size={18} fill={liked ? 'currentColor' : 'none'} />
                <span>{liked ? (video.likesCount || 1400) + 1 : (video.likesCount || 1400)}</span>
              </button>
              <div className="pill-divider" />
              <button 
                className={`action-btn-pill ${disliked ? 'active' : ''}`} 
                onClick={handleToggleDislike}
              >
                <ThumbsDown size={18} fill={disliked ? 'currentColor' : 'none'} />
              </button>
            </div>

            <button className="action-btn-pill" onClick={handleShare}>
              {copied ? <Check size={18} color="var(--color-success)" /> : <Share2 size={18} />}
              <span>{copied ? 'Скопировано!' : 'Поделиться'}</span>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="video-description-box">
          <div className="video-meta">
            <span className="meta-views">{video.views}</span>
            <span className="meta-dot">•</span>
            <span className="meta-time">{video.timeAgo}</span>
          </div>

          <div className={`video-desc-text ${showFullDesc ? 'expanded' : ''}`}>
            {video.description}
          </div>

          <button className="toggle-desc-btn" onClick={() => setShowFullDesc(!showFullDesc)}>
            {showFullDesc ? (
              <>Свернуть описание <ChevronUp size={16} /></>
            ) : (
              <>Развернуть описание <ChevronDown size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
