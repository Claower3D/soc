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

export const DEFAULT_PODCASTS: Podcast[] = [
  {
    id: 'pod_1',
    title: 'Код и Сознание: Будущее ИИ',
    author: 'Tech Mindset Podcast',
    cover: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&w=800&q=80',
    description: 'Интервью с инженерами и исследователями о синтезе технологий, нейросетей и сознания.',
    category: 'Искусственный интеллект',
    episodes: [
      {
        id: 'ep_1_1',
        title: 'Выпуск #1: Новое поколение мультимодальных моделей',
        duration: '45:20',
        date: '28 сен'
      },
      {
        id: 'ep_1_2',
        title: 'Выпуск #2: Архитектура автономных агентов и будущее разработки',
        duration: '52:10',
        date: '25 сен'
      }
    ]
  },
  {
    id: 'pod_2',
    title: 'Стартапы нового поколения: От идеи к продукту',
    author: 'Founder Stories',
    cover: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    description: 'Практические кейсы построения технологических бизнесов в современных реалиях.',
    category: 'Бизнес & Стартапы',
    episodes: [
      {
        id: 'ep_2_1',
        title: 'Выпуск #10: Привлечение инвестиций и масштабирование платформы',
        duration: '38:15',
        date: '29 сен'
      }
    ]
  },
  {
    id: 'pod_3',
    title: 'Эстетика & Дизайн Интерфейсов',
    author: 'Design Flow',
    cover: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    description: 'Как создавать захватывающие пользовательские интерфейсы и продуманный UX.',
    category: 'Дизайн & Продукт',
    episodes: [
      {
        id: 'ep_3_1',
        title: 'Выпуск #5: Микроанимации и визуальная гармония в продуктах',
        duration: '34:40',
        date: '27 сен'
      }
    ]
  }
];

export function PodcastsPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [podcastList, setPodcastList] = useState<Podcast[]>(DEFAULT_PODCASTS);
  const [activePodcast, setActivePodcast] = useState<Podcast | null>(DEFAULT_PODCASTS[0]);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(DEFAULT_PODCASTS[0]?.episodes?.[0] || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.podcasts.list().then((data) => {
      if (mounted) {
        if (Array.isArray(data) && data.length > 0) {
          const existingIds = new Set(data.map((p: Podcast) => p.id));
          const additions = DEFAULT_PODCASTS.filter(p => !existingIds.has(p.id));
          const combined = [...data, ...additions];
          setPodcastList(combined);
          setActivePodcast(combined[0]);
          if (combined[0]?.episodes?.[0]) {
            setActiveEpisode(combined[0].episodes[0]);
          }
        } else {
          setPodcastList(DEFAULT_PODCASTS);
          setActivePodcast(DEFAULT_PODCASTS[0]);
          if (DEFAULT_PODCASTS[0]?.episodes?.[0]) {
            setActiveEpisode(DEFAULT_PODCASTS[0].episodes[0]);
          }
        }
        setIsLoading(false);
      }
    }).catch(err => {
      console.warn('Failed to load podcasts', err);
      if (mounted) {
        setPodcastList(DEFAULT_PODCASTS);
        setActivePodcast(DEFAULT_PODCASTS[0]);
        if (DEFAULT_PODCASTS[0]?.episodes?.[0]) {
          setActiveEpisode(DEFAULT_PODCASTS[0].episodes[0]);
        }
        setIsLoading(false);
      }
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
    setPodcastList(prev => [newPodcast, ...(Array.isArray(prev) ? prev : [])]);
    setActivePodcast(newPodcast);
    if (newPodcast.episodes && newPodcast.episodes[0]) {
      setActiveEpisode(newPodcast.episodes[0]);
      setIsPlaying(true);
    }
  };

  const safePodcasts = Array.isArray(podcastList) ? podcastList : [];

  const filteredPodcasts = safePodcasts.filter(pod => {
    const titleMatch = (pod.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const authorMatch = (pod.author || '').toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = (pod.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || authorMatch || descMatch;
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
