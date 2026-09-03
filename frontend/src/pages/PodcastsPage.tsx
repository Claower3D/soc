import { useState } from 'react';
import { Search, Radio, Headphones, Plus } from 'lucide-react';
import { PodcastCard } from '../components/PodcastCard';
import { PodcastPlayer } from '../components/PodcastPlayer';
import { UploadPodcastModal } from '../components/UploadPodcastModal';
import { podcasts, type Podcast, type Episode } from '../data/mock';
import './PodcastsPage.css';

const categories = ['Все', 'Технологии & IT', 'Дизайн & Продукт', 'Бизнес & Стартапы', 'Искусственный интеллект'];

export function PodcastsPage() {
  const [podcastList, setPodcastList] = useState<Podcast[]>(podcasts);
  const [activePodcast, setActivePodcast] = useState<Podcast | null>(podcasts[0]);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(podcasts[0].episodes[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handlePlay = (podcast: Podcast, episode: Episode) => {
    setActivePodcast(podcast);
    setActiveEpisode(episode);
    setIsPlaying(true);
  };

  const handleUploadPodcast = (newPodcast: Podcast) => {
    setPodcastList(prev => [newPodcast, ...prev]);
    setActivePodcast(newPodcast);
    if (newPodcast.episodes[0]) {
      setActiveEpisode(newPodcast.episodes[0]);
      setIsPlaying(true);
    }
  };

  const filteredPodcasts = podcastList.filter(pod => {
    const matchesSearch = pod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pod.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          pod.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'Все') return matchesSearch;
    return matchesSearch && pod.category === selectedCategory;
  });

  return (
    <div className="podcasts-page">
      {/* Header with Search and Categories */}
      <div className="podcasts-header-section">
        <div className="podcasts-header-text">
          <div className="podcasts-badge">
            <Radio size={16} /> Аудио & Подкасты
          </div>
          <h1 className="podcasts-main-title">Подкасты и аудиошоу</h1>
          <p className="podcasts-subtitle">
            Слушайте интервью с экспертами, лекции о программировании, дизайне и стартапах или публикуйте свои выпуски.
          </p>
        </div>

        <div className="podcasts-header-actions">
          <button 
            className="btn-create-podcast-trigger"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Plus size={18} />
            <span>Опубликовать подкаст</span>
          </button>

          <div className="podcasts-search-bar">
            <Search size={18} className="pod-search-icon" />
            <input
              type="text"
              placeholder="Поиск выпусков и подкастов..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pod-search-input"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="podcasts-categories-row">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="podcasts-grid">
        {filteredPodcasts.length === 0 ? (
          <div className="no-podcasts-found">
            <Headphones size={36} />
            <p>По вашему запросу подкастов не найдено</p>
          </div>
        ) : (
          filteredPodcasts.map(podcast => (
            <PodcastCard key={podcast.id} podcast={podcast} onPlay={handlePlay} />
          ))
        )}
      </div>

      {/* Upload Podcast Modal */}
      <UploadPodcastModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadPodcast={handleUploadPodcast}
      />

      {/* Bottom Audio Player */}
      <PodcastPlayer
        podcast={activePodcast}
        episode={activeEpisode}
        isPlaying={isPlaying}
        onToggle={() => setIsPlaying(p => !p)}
        onClose={() => {
          setActiveEpisode(null);
          setIsPlaying(false);
        }}
      />
    </div>
  );
}
