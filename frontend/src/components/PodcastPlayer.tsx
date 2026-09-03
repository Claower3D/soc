import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Volume2, VolumeX } from 'lucide-react';
import type { Podcast, Episode } from '../data/mock';
import './PodcastPlayer.css';

interface PodcastPlayerProps {
  podcast: Podcast | null;
  episode: Episode | null;
  isPlaying: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export function PodcastPlayer({ podcast, episode, isPlaying, onToggle, onClose }: PodcastPlayerProps) {
  const [progress, setProgress] = useState(35);
  const [isMuted, setIsMuted] = useState(false);

  if (!podcast || !episode) {
    return null;
  }

  return (
    <div className="podcast-player-container active">
      {/* Progress Slider on top edge */}
      <div className="player-progress-bar">
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="progress-slider" 
        />
      </div>

      <div className="player-content">
        {/* Track Info */}
        <div className="player-track-info">
          <img src={podcast.cover} alt={podcast.title} className="player-cover" />
          <div className="player-titles">
            <div className="player-episode-title" title={episode.title}>{episode.title}</div>
            <div className="player-podcast-title">{podcast.title}</div>
          </div>
        </div>

        {/* Center Controls */}
        <div className="player-controls">
          <button className="player-control-btn skip" title="Назад 15 сек">
            <SkipBack size={18} />
          </button>
          <button 
            className={`player-control-btn play-pause ${isPlaying ? 'playing' : ''}`} 
            onClick={onToggle}
            title={isPlaying ? 'Пауза' : 'Воспроизведение'}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
          </button>
          <button className="player-control-btn skip" title="Вперед 15 сек">
            <SkipForward size={18} />
          </button>
        </div>

        {/* Right Side: Time, Volume, Close */}
        <div className="player-right-side">
          <div className="player-time">
            12:30 / {episode.duration}
          </div>

          <button 
            className="player-control-btn icon-only" 
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Включить звук' : 'Без звука'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {onClose && (
            <button 
              className="player-control-btn close-player-btn" 
              onClick={onClose}
              title="Закрыть плеер"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
