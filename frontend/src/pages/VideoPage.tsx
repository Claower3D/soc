import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Upload, Lock, Film, Baby, 
  Compass, Radio, Tv, Flame, Sparkles, Filter, 
  ArrowLeft, CheckCircle2, ChevronRight, SlidersHorizontal, Gamepad2, Music
} from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';
import { UploadVideoModal } from '../components/UploadVideoModal';
import { type Video } from '../data/mock';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import './VideoPage.css';

type VideoCategoryTab = 'all' | 'streams' | 'videos' | 'movies' | 'series' | 'kids' | 'dev' | 'gaming' | 'music';

export function VideoPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.videos.list().then((data) => {
      if (mounted) {
        setVideoList(data);
        setIsLoading(false);
      }
    }).catch((err) => {
      console.warn('Failed to load videos', err);
      if (mounted) setIsLoading(false);
    });
    return () => { mounted = false; };
  }, []);
  
  // Режим просмотра: если выбран конкретный ролик/стрим — показываем плеер + рекомендации, если null — витрину YouTube
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Активный чипс/вкладка категории
  const [activeCategory, setActiveCategory] = useState<VideoCategoryTab>('all');
  
  // Дополнительные фильтры
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'rating' | 'newest'>('recommended');

  const [isKidsModeActive, setIsKidsModeActive] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleUploadVideo = (newVideo: Video) => {
    setVideoList(prev => [newVideo, ...prev]);
    setSelectedVideo(newVideo);
  };

  // Переключение в Детский режим
  const handleToggleKidsMode = () => {
    const nextState = !isKidsModeActive;
    setIsKidsModeActive(nextState);
    if (nextState) {
      setActiveCategory('kids');
    } else {
      setActiveCategory('all');
    }
  };

  // Выбор видео для просмотра
  const handleSelectVideo = (video: Video) => {
    setSelectedVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Фильтрованный список видео
  const filteredVideos = useMemo(() => {
    return videoList.filter(v => {
      // Детский режим изолирует мультики 0+ / 6+
      if (isKidsModeActive || activeCategory === 'kids') {
        if (!v.isKids && v.category !== 'Мультфильмы') return false;
      } else if (activeCategory === 'streams') {
        if (!v.isStream) return false;
      } else if (activeCategory === 'movies') {
        if (!v.isMovie && v.category !== 'Фильмы') return false;
      } else if (activeCategory === 'series') {
        if (!v.isSeries && v.category !== 'Сериалы') return false;
      } else if (activeCategory === 'videos') {
        if (v.isStream || v.isMovie || v.isSeries || v.isKids) return false;
      } else if (activeCategory === 'dev') {
        if (v.category !== 'Разработка' && !v.title.toLowerCase().includes('react') && !v.title.toLowerCase().includes('go')) return false;
      } else if (activeCategory === 'gaming') {
        if (v.category !== 'Игры' && !v.title.toLowerCase().includes('cyberpunk')) return false;
      } else if (activeCategory === 'music') {
        if (v.category !== 'Музыка') return false;
      }

      // Фильтр по возрасту
      if (ageFilter !== 'all' && v.ageRating && v.ageRating !== ageFilter) {
        return false;
      }

      // Поисковый запрос
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = v.title.toLowerCase().includes(q);
        const matchChannel = v.channel.name.toLowerCase().includes(q);
        const matchDesc = v.description.toLowerCase().includes(q);
        const matchGenre = (v.genre || '').toLowerCase().includes(q);
        const matchGame = (v.streamGameOrTopic || '').toLowerCase().includes(q);
        if (!matchTitle && !matchChannel && !matchDesc && !matchGenre && !matchGame) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });
  }, [videoList, isKidsModeActive, activeCategory, ageFilter, searchQuery, sortBy]);

  // Подборки для витрины в стиле YouTube (когда activeCategory === 'all' и нет поиска)
  const isBrowseHome = activeCategory === 'all' && !searchQuery.trim() && !isKidsModeActive;

  const liveStreams = useMemo(() => videoList.filter(v => v.isStream), [videoList]);
  const recommendedVideos = useMemo(() => videoList.filter(v => !v.isStream && !v.isMovie && !v.isSeries && !v.isKids), [videoList]);
  const subscriptionVideos = useMemo(() => videoList.filter(v => v.isFromSubscription), [videoList]);
  const moviesList = useMemo(() => videoList.filter(v => v.isMovie), [videoList]);
  const seriesList = useMemo(() => videoList.filter(v => v.isSeries), [videoList]);
  const kidsList = useMemo(() => videoList.filter(v => v.isKids), [videoList]);

  // =========================================================================
  // RENDER: РЕЖИМ ПРОСМОТРА РОЛИКА (WATCH VIEW)
  // =========================================================================
  if (isLoading) {
    return <div style={{ padding: '20px', color: '#fff' }}>Загрузка...</div>;
  }

  if (selectedVideo) {
    const queueVideos = videoList.filter(v => v.id !== selectedVideo.id);

    return (
      <div className={`video-watch-page ${isKidsModeActive ? 'kids-environment' : ''}`}>
        <div className="watch-top-nav">
          <button 
            type="button" 
            className="btn-back-to-catalog"
            onClick={() => setSelectedVideo(null)}
          >
            <ArrowLeft size={16} />
            <span>Назад к каталогу</span>
          </button>

          <div className="watch-search-bar">
            <Search size={15} className="watch-search-icon" />
            <input
              type="text"
              placeholder="Поиск видео и стримов..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSelectedVideo(null); // Возврат к поисковой витрине
              }}
              className="watch-search-input"
            />
          </div>

          <button 
            type="button"
            className={`btn-watch-kids-toggle ${isKidsModeActive ? 'active' : ''}`}
            onClick={handleToggleKidsMode}
          >
            <Baby size={16} />
            <span>{isKidsModeActive ? 'Детский режим ВКЛ' : 'Детский режим'}</span>
          </button>
        </div>

        <div className="watch-content-grid">
          {/* Main Video/Stream Player */}
          <div className="watch-main-player">
            <VideoPlayer 
              video={selectedVideo} 
              onSelectVideo={setSelectedVideo}
              isKidsMode={isKidsModeActive}
            />
          </div>

          {/* Right Recommendation Queue */}
          <aside className="watch-sidebar-queue">
            <div className="queue-header">
              <h3 className="queue-title">
                {selectedVideo.isStream ? (
                  <><Radio size={16} color="#ef4444" /> Другие стримы и видео</>
                ) : (
                  <><Sparkles size={16} color="var(--color-accent)" /> Рекомендации</>
                )}
              </h3>
            </div>

            <div className="queue-list">
              {queueVideos.map(item => (
                <div 
                  key={item.id} 
                  className={`queue-item-card ${item.isStream ? 'stream-item' : ''}`}
                  onClick={() => handleSelectVideo(item)}
                >
                  <div className="queue-thumb-wrap">
                    <img src={item.thumbnail} alt={item.title} />
                    <span className={`queue-badge ${item.isStream ? 'badge-live' : ''}`}>
                      {item.isStream ? '🔴 LIVE' : item.duration}
                    </span>
                    {item.rating && <span className="queue-rating-badge">★ {item.rating}</span>}
                    {item.isKids && <span className="queue-kids-badge">0+</span>}
                  </div>
                  <div className="queue-item-details">
                    <p className="queue-item-title" title={item.title}>{item.title}</p>
                    <span className="queue-channel-name">{item.channel.name}</span>
                    <div className="queue-meta-row">
                      <span>{item.isStream ? `${item.viewersCount?.toLocaleString('ru-RU')} зрит.` : item.views}</span>
                      <span>•</span>
                      <span>{item.timeAgo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: ВИД КАТАЛОГА В СТИЛЕ YOUTUBE (BROWSE VIEW)
  // =========================================================================
  return (
    <div className={`youtube-portal-page ${isKidsModeActive ? 'kids-environment' : ''}`}>
      {/* Top Banner for Kids Mode notification if active */}
      {isKidsModeActive && (
        <div className="kids-portal-banner">
          <div className="kids-banner-text">
            <span className="balloon-icon">🎈</span>
            <div>
              <strong>Включен Детский Режим «New Age Kids»</strong>
              <p>Отображаются исключительно проверенные развивающие мультфильмы и сказки (0+ / 6+). Без взрослого контента.</p>
            </div>
          </div>
          <button className="btn-exit-kids-portal" onClick={handleToggleKidsMode}>
            Выйти из детского режима
          </button>
        </div>
      )}

      {/* Top Navigation & Search Bar */}
      <div className="portal-top-bar">
        {/* Search Field */}
        <div className="portal-search-box">
          <Search size={18} className="portal-search-icon" />
          <input
            type="text"
            placeholder={isKidsModeActive ? "Поиск добрых мультиков и сказок..." : "Введите запрос для поиска видео, фильмов, сериалов или стримов..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="portal-search-input"
          />
          {searchQuery && (
            <button className="portal-clear-search" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Actions (Filter, Kids Mode, Upload) */}
        <div className="portal-actions-group">
          <button 
            type="button" 
            className={`btn-filter-trigger ${ageFilter !== 'all' || sortBy !== 'recommended' ? 'has-active-filters' : ''}`}
            onClick={() => setShowFilterModal(!showFilterModal)}
            title="Фильтры по годам, рейтингу и возрасту"
          >
            <SlidersHorizontal size={16} />
            <span>Фильтры</span>
          </button>

          <button 
            type="button"
            className={`btn-kids-mode-switch ${isKidsModeActive ? 'active' : ''}`}
            onClick={handleToggleKidsMode}
            title={isKidsModeActive ? "Отключить детский режим" : "Включить детский режим"}
          >
            <Baby size={17} />
            <span>{isKidsModeActive ? 'Детский режим ВКЛ' : 'Детский режим'}</span>
          </button>

          {!isKidsModeActive && (
            isAuthenticated ? (
              <button 
                type="button" 
                className="btn-portal-upload"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Upload size={16} />
                <span>Загрузить видео</span>
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-portal-upload guest-restricted"
                onClick={() => openAuthModal('register')}
                title="Зарегистрируйтесь для загрузки видео"
              >
                <Lock size={15} />
                <span>Загрузить</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Filter Dropdown Popover */}
      {showFilterModal && (
        <div className="portal-filter-popover">
          <div className="filter-popover-header">
            <span className="filter-popover-title"><Filter size={15} /> Настройки фильтрации</span>
            <button className="btn-close-filter-popover" onClick={() => setShowFilterModal(false)}>✕</button>
          </div>
          <div className="filter-popover-body">
            <div className="filter-group">
              <label className="filter-label">Сортировка</label>
              <div className="filter-pills-row">
                <button 
                  className={`filter-pill-btn ${sortBy === 'recommended' ? 'active' : ''}`}
                  onClick={() => setSortBy('recommended')}
                >
                  По популярности
                </button>
                <button 
                  className={`filter-pill-btn ${sortBy === 'rating' ? 'active' : ''}`}
                  onClick={() => setSortBy('rating')}
                >
                  По рейтингу ★
                </button>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Возрастной рейтинг</label>
              <div className="filter-pills-row">
                {['all', '0+', '6+', '12+', '16+', '18+'].map(rating => (
                  <button 
                    key={rating}
                    className={`filter-pill-btn ${ageFilter === rating ? 'active' : ''}`}
                    onClick={() => setAgeFilter(rating)}
                  >
                    {rating === 'all' ? 'Все возрасты' : rating}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills (YouTube Tabs) */}
      <div className="portal-category-pills">
        <button 
          className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('all'); setIsKidsModeActive(false); }}
        >
          <Compass size={14} />
          <span>Все</span>
        </button>

        <button 
          className={`category-pill live-pill ${activeCategory === 'streams' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('streams'); setIsKidsModeActive(false); }}
        >
          <Radio size={14} />
          <span>Стримы 🔴 (Twitch)</span>
          <span className="live-count-chip">{liveStreams.length}</span>
        </button>

        <button 
          className={`category-pill ${activeCategory === 'videos' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('videos'); setIsKidsModeActive(false); }}
        >
          <Flame size={14} />
          <span>Видеоролики 🎥</span>
        </button>

        <button 
          className={`category-pill ${activeCategory === 'movies' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('movies'); setIsKidsModeActive(false); }}
        >
          <Film size={14} />
          <span>Фильмы 🎬</span>
        </button>

        <button 
          className={`category-pill ${activeCategory === 'series' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('series'); setIsKidsModeActive(false); }}
        >
          <Tv size={14} />
          <span>Сериалы 📺</span>
        </button>

        <button 
          className={`category-pill kids-pill ${activeCategory === 'kids' || isKidsModeActive ? 'active' : ''}`}
          onClick={() => { setActiveCategory('kids'); setIsKidsModeActive(true); }}
        >
          <Baby size={14} />
          <span>Детское 🎈</span>
        </button>

        <button 
          className={`category-pill ${activeCategory === 'dev' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('dev'); setIsKidsModeActive(false); }}
        >
          <span>IT & Код 💻</span>
        </button>

        <button 
          className={`category-pill ${activeCategory === 'gaming' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('gaming'); setIsKidsModeActive(false); }}
        >
          <Gamepad2 size={14} />
          <span>Игры 🎮</span>
        </button>

        <button 
          className={`category-pill ${activeCategory === 'music' ? 'active' : ''}`}
          onClick={() => { setActiveCategory('music'); setIsKidsModeActive(false); }}
        >
          <Music size={14} />
          <span>Музыка 🎵</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION ROWS (IF BROWSE HOME LIKE YOUTUBE SCREENSHOT) */}
      {/* ========================================================================= */}
      {isBrowseHome ? (
        <div className="portal-sections-container">
          {/* SECTION 1: TWITCH LIVE STREAMS ZONE */}
          <section className="portal-row-section twitch-zone-section">
            <div className="section-title-bar">
              <div className="section-title-left">
                <span className="live-pulsing-circle" />
                <h2 className="section-main-heading">В прямом эфире (Стримы как на Twitch)</h2>
              </div>
              <button className="btn-section-see-all" onClick={() => setActiveCategory('streams')}>
                <span>Смотреть все стримы</span>
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="portal-cards-horizontal-scroll">
              {liveStreams.map(stream => (
                <div 
                  key={stream.id} 
                  className="portal-video-card stream-card"
                  onClick={() => handleSelectVideo(stream)}
                >
                  <div className="portal-card-thumb-wrap">
                    <img src={stream.thumbnail} alt={stream.title} />
                    <div className="card-badge-live">
                      <Radio size={12} className="animate-spin-slow" />
                      <span>LIVE • {stream.viewersCount?.toLocaleString('ru-RU')}</span>
                    </div>
                    {stream.streamGameOrTopic && (
                      <span className="stream-game-tag">{stream.streamGameOrTopic}</span>
                    )}
                  </div>
                  <div className="portal-card-body">
                    <img src={stream.channel.avatar} alt={stream.channel.name} className="portal-channel-avatar" />
                    <div className="portal-card-meta">
                      <h4 className="portal-card-title" title={stream.title}>{stream.title}</h4>
                      <div className="portal-card-channel-name">{stream.channel.name}</div>
                      <div className="portal-card-subline">
                        <span className="stream-category-accent">{stream.genre}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 2: RECOMMENDED VIDEOS (YOUTUBE SCREENSHOT STYLE) */}
          <section className="portal-row-section">
            <div className="section-title-bar">
              <div className="section-title-left">
                <Sparkles size={20} color="var(--color-accent)" />
                <h2 className="section-main-heading">Рекомендации (Recommended)</h2>
              </div>
              <button className="btn-section-see-all" onClick={() => setActiveCategory('videos')}>
                <span>Показать ещё</span>
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="portal-cards-grid">
              {recommendedVideos.map(item => (
                <div 
                  key={item.id} 
                  className="portal-video-card"
                  onClick={() => handleSelectVideo(item)}
                >
                  <div className="portal-card-thumb-wrap">
                    <img src={item.thumbnail} alt={item.title} />
                    <span className="card-duration-badge">{item.duration}</span>
                  </div>
                  <div className="portal-card-body">
                    <img src={item.channel.avatar} alt={item.channel.name} className="portal-channel-avatar" />
                    <div className="portal-card-meta">
                      <h4 className="portal-card-title" title={item.title}>{item.title}</h4>
                      <div className="portal-card-channel-name">{item.channel.name}</div>
                      <div className="portal-card-subline">
                        <span>{item.views}</span>
                        <span className="dot">•</span>
                        <span>{item.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: FROM YOUR SUBSCRIPTIONS (ИЗ ВАШИХ ПОДПИСОК) */}
          <section className="portal-row-section subscriptions-section">
            <div className="section-title-bar">
              <div className="section-title-left">
                <CheckCircle2 size={20} color="#10b981" />
                <h2 className="section-main-heading">Из ваших подписок (From your subscriptions)</h2>
              </div>
              <span className="section-badge-counter">{subscriptionVideos.length} свежих</span>
            </div>

            <div className="portal-cards-grid">
              {subscriptionVideos.map(item => (
                <div 
                  key={item.id} 
                  className="portal-video-card"
                  onClick={() => handleSelectVideo(item)}
                >
                  <div className="portal-card-thumb-wrap">
                    <img src={item.thumbnail} alt={item.title} />
                    <span className="card-duration-badge">{item.duration}</span>
                  </div>
                  <div className="portal-card-body">
                    <img src={item.channel.avatar} alt={item.channel.name} className="portal-channel-avatar" />
                    <div className="portal-card-meta">
                      <h4 className="portal-card-title" title={item.title}>{item.title}</h4>
                      <div className="portal-card-channel-name">{item.channel.name}</div>
                      <div className="portal-card-subline">
                        <span>{item.views}</span>
                        <span className="dot">•</span>
                        <span>{item.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: MOVIES (ФИЛЬМЫ) */}
          <section className="portal-row-section">
            <div className="section-title-bar">
              <div className="section-title-left">
                <Film size={20} color="#f59e0b" />
                <h2 className="section-main-heading">Кинозал & Фильмы</h2>
              </div>
              <button className="btn-section-see-all" onClick={() => setActiveCategory('movies')}>
                <span>Все фильмы</span>
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="portal-cards-grid">
              {moviesList.map(item => (
                <div 
                  key={item.id} 
                  className="portal-video-card movie-card"
                  onClick={() => handleSelectVideo(item)}
                >
                  <div className="portal-card-thumb-wrap">
                    <img src={item.thumbnail} alt={item.title} />
                    <span className="card-duration-badge">{item.duration}</span>
                    <span className="card-rating-badge">★ {item.rating}</span>
                    <span className="card-age-badge">{item.ageRating}</span>
                  </div>
                  <div className="portal-card-body">
                    <img src={item.channel.avatar} alt={item.channel.name} className="portal-channel-avatar" />
                    <div className="portal-card-meta">
                      <h4 className="portal-card-title" title={item.title}>{item.title}</h4>
                      <div className="portal-card-subline">
                        <span className="movie-genre-badge">{item.genre}</span>
                        <span className="dot">•</span>
                        <span>{item.releaseYear} г.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: SERIES (СЕРИАЛЫ) */}
          <section className="portal-row-section">
            <div className="section-title-bar">
              <div className="section-title-left">
                <Tv size={20} color="#8b5cf6" />
                <h2 className="section-main-heading">Сериалы</h2>
              </div>
              <button className="btn-section-see-all" onClick={() => setActiveCategory('series')}>
                <span>Все сериалы</span>
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="portal-cards-grid">
              {seriesList.map(item => (
                <div 
                  key={item.id} 
                  className="portal-video-card series-card"
                  onClick={() => handleSelectVideo(item)}
                >
                  <div className="portal-card-thumb-wrap">
                    <img src={item.thumbnail} alt={item.title} />
                    <span className="card-duration-badge">{item.duration}</span>
                    <span className="card-rating-badge">★ {item.rating}</span>
                  </div>
                  <div className="portal-card-body">
                    <img src={item.channel.avatar} alt={item.channel.name} className="portal-channel-avatar" />
                    <div className="portal-card-meta">
                      <h4 className="portal-card-title" title={item.title}>{item.title}</h4>
                      <div className="portal-card-subline">
                        <span>{item.genre}</span>
                        <span className="dot">•</span>
                        <span className="series-seasons-text">{item.seriesInfo?.seasonsCount} сезона</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: KIDS & CARTOONS (ДЕТСКИЙ РАЗДЕЛ) */}
          <section className="portal-row-section kids-highlight-section">
            <div className="section-title-bar">
              <div className="section-title-left">
                <Baby size={20} color="#ec4899" />
                <h2 className="section-main-heading">Детский уголок New Age Kids 🎈</h2>
              </div>
              <button className="btn-section-see-all" onClick={() => { setActiveCategory('kids'); setIsKidsModeActive(true); }}>
                <span>Включить детский режим</span>
                <ChevronRight size={15} />
              </button>
            </div>

            <div className="portal-cards-grid">
              {kidsList.map(item => (
                <div 
                  key={item.id} 
                  className="portal-video-card kids-card"
                  onClick={() => handleSelectVideo(item)}
                >
                  <div className="portal-card-thumb-wrap">
                    <img src={item.thumbnail} alt={item.title} />
                    <span className="card-duration-badge">{item.duration}</span>
                    <span className="card-kids-rating-pill">0+ / 6+</span>
                  </div>
                  <div className="portal-card-body">
                    <img src={item.channel.avatar} alt={item.channel.name} className="portal-channel-avatar" />
                    <div className="portal-card-meta">
                      <h4 className="portal-card-title" title={item.title}>{item.title}</h4>
                      <div className="portal-card-channel-name">{item.channel.name}</div>
                      <div className="portal-card-subline">
                        <span>{item.views}</span>
                        <span className="dot">•</span>
                        <span>{item.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* ========================================================================= */
        /* CATEGORY FILTERED OR SEARCH RESULTS GRID */
        /* ========================================================================= */
        <div className="portal-filtered-grid-container">
          <div className="filtered-header-bar">
            <h2 className="filtered-heading">
              {activeCategory === 'streams' && '🔴 Прямые трансляции (Twitch Live)'}
              {activeCategory === 'movies' && '🎬 Каталог фильмов'}
              {activeCategory === 'series' && '📺 Каталог сериалов'}
              {activeCategory === 'kids' && '🎈 Детский режим (Мультфильмы 0+ / 6+)'}
              {activeCategory === 'dev' && '💻 IT & Программирование'}
              {activeCategory === 'gaming' && '🎮 Игры и стримы'}
              {activeCategory === 'music' && '🎵 Музыка и трансляции'}
              {activeCategory === 'videos' && '🎥 Видеоролики'}
              {searchQuery && ` Результаты поиска: «${searchQuery}»`}
              <span className="filtered-count">({filteredVideos.length})</span>
            </h2>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="portal-empty-results">
              <Film size={48} className="empty-icon" />
              <h3>Ничего не найдено</h3>
              <p>Попробуйте изменить категорию, сбросить фильтры или ввести другой поисковый запрос.</p>
              <button 
                type="button" 
                className="btn-reset-portal-filters"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                  setAgeFilter('all');
                  setIsKidsModeActive(false);
                }}
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="portal-cards-grid">
              {filteredVideos.map(item => (
                <div 
                  key={item.id} 
                  className={`portal-video-card ${item.isStream ? 'stream-card' : ''} ${item.isKids ? 'kids-card' : ''}`}
                  onClick={() => handleSelectVideo(item)}
                >
                  <div className="portal-card-thumb-wrap">
                    <img src={item.thumbnail} alt={item.title} />
                    <span className={`card-duration-badge ${item.isStream ? 'badge-live' : ''}`}>
                      {item.isStream ? '🔴 LIVE' : item.duration}
                    </span>
                    {item.rating && <span className="card-rating-badge">★ {item.rating}</span>}
                    {item.isKids && <span className="card-kids-rating-pill">{item.ageRating || '0+'}</span>}
                  </div>
                  <div className="portal-card-body">
                    <img src={item.channel.avatar} alt={item.channel.name} className="portal-channel-avatar" />
                    <div className="portal-card-meta">
                      <h4 className="portal-card-title" title={item.title}>{item.title}</h4>
                      <div className="portal-card-channel-name">{item.channel.name}</div>
                      <div className="portal-card-subline">
                        <span>{item.isStream ? `${item.viewersCount?.toLocaleString('ru-RU')} зрит.` : item.views}</span>
                        <span className="dot">•</span>
                        <span>{item.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Video Modal */}
      <UploadVideoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadVideo={handleUploadVideo}
      />
    </div>
  );
}

