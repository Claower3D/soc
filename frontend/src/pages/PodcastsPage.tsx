import { useState, useEffect } from 'react';
import { Search, Radio, Headphones, Plus, Lock } from 'lucide-react';
import { PodcastCard } from '../components/PodcastCard';
import { PodcastPlayer } from '../components/PodcastPlayer';
import { UploadPodcastModal } from '../components/UploadPodcastModal';
import { type Podcast, type Episode } from '../data/mock';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './PodcastsPage.css';

const categories = ['Все', 'Технологии & IT', 'Дизайн & Продукт', 'Бизнес & Стартапы', 'Искусственный интеллект'];

export function PodcastsPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [podcastList, setPodcastList] = useState<Podcast[]>([]);
  const [activePodcast, setActivePodcast] = useState<Podcast | null>(null);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.podcasts.list().then((data) => {
      if (mounted) {
        setPodcastList(data);
        if (data.length > 0) {
          setActivePodcast(data[0]);
          setActiveEpisode(data[0].episodes[0]);
        }
        setIsLoading(false);
      }
    }).catch(err => {
      console.warn('Failed to load podcasts', err);
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);
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

  if (isLoading) {
    return <div style={{ padding: '20px', color: '#fff' }}>Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="podcasts-page">
        <div className="messenger-guest-lock-container">
          <GuestLockPrompt
            featureName="Подкасты и аудиошоу"
            title="Раздел подкастов доступен после регистрации"
            description="Слушайте выпуски экспертов, подписывайтесь на авторов аудиошоу или публикуйте собственные подкасты в экосистеме New Age."
            actionText="Войти или зарегистрироваться"
          />
        </div>
      </div>
    );
  }

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
          {isAuthenticated ? (
            <button 
              className="btn-create-podcast-trigger"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus size={18} />
              <span>Опубликовать подкаст</span>
            </button>
          ) : (
            <button 
              className="btn-create-podcast-trigger guest-restricted-btn"
              onClick={() => openAuthModal('register')}
              title="Для публикации подкаста войдите в аккаунт"
            >
              <Lock size={16} />
              <span>Опубликовать подкаст</span>
            </button>
          )}

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
