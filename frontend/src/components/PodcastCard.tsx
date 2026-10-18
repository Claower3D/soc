import { Play, Pause, Radio } from 'lucide-react';
import type { Podcast, Episode } from '../data/mock';
import './PodcastCard.css';

interface PodcastCardProps {
  podcast: Podcast;
  onPlay: (podcast: Podcast, episode: Episode) => void;
  activeEpisodeId?: string | null;
  isPlaying?: boolean;
}

export function PodcastCard({ podcast, onPlay, activeEpisodeId, isPlaying }: PodcastCardProps) {
  const episodesCount = podcast.episodes?.length || 0;
  const isAnyEpisodePlaying = isPlaying && podcast.episodes?.some(ep => ep.id === activeEpisodeId);

  const handleQuickPlay = () => {
    if (podcast.episodes && podcast.episodes.length > 0) {
      const current = podcast.episodes.find(ep => ep.id === activeEpisodeId) || podcast.episodes[0];
      onPlay(podcast, current);
    }
  };

  return (
    <div className={`podcast-card ${isAnyEpisodePlaying ? 'is-active-card' : ''}`}>
      {/* Top Header: Cover Thumbnail + Title & Author */}
      <div className="podcast-card-header">
        <div 
          className="podcast-cover-wrapper" 
          onClick={handleQuickPlay} 
          role="button" 
          tabIndex={0}
          title="Слушать выпуск"
        >
          <img src={podcast.cover} alt={podcast.title} className="podcast-cover" loading="lazy" />
          <div className="podcast-cover-overlay">
            <div className="podcast-cover-play-badge">
              {isAnyEpisodePlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" />
              )}
            </div>
          </div>
        </div>

        <div className="podcast-header-info">
          {podcast.category && (
            <span className="podcast-category-badge">{podcast.category}</span>
          )}
          <h2 className="podcast-title" title={podcast.title}>
            {podcast.title}
          </h2>
          <div className="podcast-author" title={podcast.author}>
            <Radio size={13} className="podcast-author-icon" />
            <span>{podcast.author}</span>
          </div>
        </div>
      </div>

      {/* Description - Spanning full width with normalized height */}
      <p className="podcast-description" title={podcast.description}>
        {podcast.description}
      </p>

      {/* Episodes Section - Pinned to bottom with normalized alignment */}
      <div className="episodes-section">
        <div className="episodes-header">
          <h3 className="episodes-title">Эпизоды</h3>
          <span className="episodes-count-tag">
            {episodesCount === 1 ? '1 выпуск' : `${episodesCount} выпуска`}
          </span>
        </div>

        <div className="episodes-list">
          {podcast.episodes.map(ep => {
            const isThisPlaying = isPlaying && activeEpisodeId === ep.id;
            return (
              <div 
                key={ep.id} 
                className={`episode-item ${isThisPlaying ? 'playing' : ''}`}
                onClick={() => onPlay(podcast, ep)}
              >
                <button 
                  className={`episode-play-btn ${isThisPlaying ? 'playing' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(podcast, ep);
                  }}
                  title={isThisPlaying ? 'Пауза' : 'Воспроизвести выпуск'}
                  aria-label={isThisPlaying ? 'Пауза' : 'Воспроизвести выпуск'}
                >
                  {isThisPlaying ? (
                    <Pause size={16} fill="currentColor" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                </button>
                <div className="episode-details">
                  <div className="episode-name" title={ep.title}>{ep.title}</div>
                  <div className="episode-meta">
                    <span className="episode-date">{ep.date}</span>
                    <span className="meta-dot">•</span>
                    <span className="episode-duration">{ep.duration}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
