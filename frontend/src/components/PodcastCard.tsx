import { Play } from 'lucide-react';
import type { Podcast, Episode } from '../data/mock';
import './PodcastCard.css';

interface PodcastCardProps {
  podcast: Podcast;
  onPlay: (podcast: Podcast, episode: Episode) => void;
}

export function PodcastCard({ podcast, onPlay }: PodcastCardProps) {
  return (
    <div className="podcast-card">
      <div className="podcast-header">
        <img src={podcast.cover} alt={podcast.title} className="podcast-cover" />
        <div className="podcast-info">
          <h2 className="podcast-title">{podcast.title}</h2>
          <div className="podcast-author">{podcast.author}</div>
          <p className="podcast-description">{podcast.description}</p>
        </div>
      </div>

      <div className="episodes-list">
        <h3 className="episodes-title">Эпизоды</h3>
        {podcast.episodes.map(ep => (
          <div key={ep.id} className="episode-item">
            <button className="episode-play-btn" onClick={() => onPlay(podcast, ep)}>
              <Play size={20} fill="currentColor" />
            </button>
            <div className="episode-details">
              <div className="episode-name">{ep.title}</div>
              <div className="episode-meta">
                <span>{ep.date}</span>
                <span className="meta-dot">•</span>
                <span>{ep.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
