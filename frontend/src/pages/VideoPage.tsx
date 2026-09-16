import { useState, useMemo } from 'react';
import { 
  Search, Upload, Video as VideoIcon, Lock, Film, Baby, 
  Compass
} from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';
import { UploadVideoModal } from '../components/UploadVideoModal';
import { videos, type Video } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import './VideoPage.css';

type VideoSectionTab = 'all' | 'movies' | 'kids' | 'dev';

export function VideoPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [videoList, setVideoList] = useState<Video[]>(videos);
  const [selectedVideo, setSelectedVideo] = useState<Video>(videos[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Активный режим раздела: Все ролики / Фильмы / Детский режим (мультики) / Разработка
  const [activeSection, setActiveSection] = useState<VideoSectionTab>('all');
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
      setActiveSection('kids');
      const firstKidVideo = videoList.find(v => v.isKids);
      if (firstKidVideo) setSelectedVideo(firstKidVideo);
    } else {
      setActiveSection('all');
    }
  };

  // Фильтрация по разделам и поиску
  const filteredVideos = useMemo(() => {
    return videoList.filter(v => {
      // Детский режим фильтрует ТОЛЬКО безопасный детский контент (мультики 0+, 6+)
      if (isKidsModeActive || activeSection === 'kids') {
        if (!v.isKids && v.category !== 'Мультфильмы') return false;
      } else if (activeSection === 'movies') {
        if (!v.isMovie && v.category !== 'Фильмы') return false;
      } else if (activeSection === 'dev') {
        if (v.category !== 'Разработка' && !v.title.toLowerCase().includes('react') && !v.title.toLowerCase().includes('go')) return false;
      }

      // Поисковый запрос
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = v.title.toLowerCase().includes(q);
        const matchChannel = v.channel.name.toLowerCase().includes(q);
        const matchDesc = v.description.toLowerCase().includes(q);
        const matchGenre = (v.genre || '').toLowerCase().includes(q);
        if (!matchTitle && !matchChannel && !matchDesc && !matchGenre) return false;
      }

      return true;
    });
  }, [videoList, isKidsModeActive, activeSection, searchQuery]);

  return (
    <div className={`video-page ${isKidsModeActive ? 'kids-environment' : ''}`}>
      {/* Top Banner for Kids Mode notification if active */}
      {isKidsModeActive && (
        <div className="kids-mode-top-banner">
          <div className="kids-banner-content">
            <span className="kids-balloon">🎈</span>
            <div>
              <strong>Включен Детский Режим «New Age Kids»</strong>
              <p>Отображаются только проверенные мультфильмы, сказки и познавательный контент (0+ / 6+). Без взрослого контента.</p>
            </div>
          </div>
          <button className="btn-exit-kids" onClick={handleToggleKidsMode}>
            Выйти из детского режима
          </button>
        </div>
      )}

      {/* Main Video Section */}
      <div className="video-main">
        <VideoPlayer 
          video={selectedVideo} 
          onSelectVideo={setSelectedVideo}
          isKidsMode={isKidsModeActive}
        />
      </div>

      {/* Sidebar: Sections, Recommendations, and Queue */}
      <aside className="video-sidebar">
        {/* Top Control: Kids Mode Toggle & Upload Video */}
        <div className="video-top-toggles-bar">
          <button 
            type="button"
            className={`btn-toggle-kids-mode ${isKidsModeActive ? 'active' : ''}`}
            onClick={handleToggleKidsMode}
            title={isKidsModeActive ? 'Отключить детский режим' : 'Включить детский режим (мультфильмы и сказки)'}
          >
            <Baby size={18} />
            <span>{isKidsModeActive ? 'Детский режим ВКЛ' : 'Детский режим'}</span>
          </button>

          {!isKidsModeActive && (
            isAuthenticated ? (
              <button 
                className="btn-upload-video-trigger"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Upload size={15} />
                <span>Загрузить</span>
              </button>
            ) : (
              <button 
                className="btn-upload-video-trigger guest-restricted-btn"
                onClick={() => openAuthModal('register')}
                title="Для загрузки видео требуется зарегистрироваться"
              >
                <Lock size={15} />
                <span>Загрузить</span>
              </button>
            )
          )}
        </div>

        {/* Section Navigation Tabs (Все, Фильмы, Мультики, Разработка...) */}
        <div className="video-section-nav-tabs">
          <button 
            className={`section-tab-pill ${activeSection === 'all' && !isKidsModeActive ? 'active' : ''}`}
            onClick={() => { setActiveSection('all'); setIsKidsModeActive(false); }}
          >
            <Compass size={14} />
            <span>Все</span>
          </button>

          <button 
            className={`section-tab-pill ${activeSection === 'movies' ? 'active' : ''}`}
            onClick={() => { setActiveSection('movies'); setIsKidsModeActive(false); }}
          >
            <Film size={14} />
            <span>Фильмы 🎬</span>
          </button>

          <button 
            className={`section-tab-pill kids-pill ${activeSection === 'kids' || isKidsModeActive ? 'active' : ''}`}
            onClick={() => { setActiveSection('kids'); setIsKidsModeActive(true); }}
          >
            <Baby size={14} />
            <span>Мультфильмы 🎈</span>
          </button>

          <button 
            className={`section-tab-pill ${activeSection === 'dev' ? 'active' : ''}`}
            onClick={() => { setActiveSection('dev'); setIsKidsModeActive(false); }}
          >
            <span>IT & Код</span>
          </button>
        </div>

        {/* Search Bar in Video Section */}
        <div className="video-sidebar-search">
          <Search size={16} className="video-search-icon" />
          <input
            type="text"
            placeholder={isKidsModeActive ? "Поиск мультиков и сказок..." : "Поиск по видео, фильмам..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="video-search-input"
          />
        </div>

        {/* Sidebar recommendations header */}
        <div className="video-sidebar-header-row">
          <h3 className="video-sidebar-title">
            {activeSection === 'movies' ? (
              <><Film size={16} /> Каталог фильмов ({filteredVideos.length})</>
            ) : isKidsModeActive ? (
              <><Baby size={16} /> Детские мультфильмы ({filteredVideos.length})</>
            ) : (
              <><VideoIcon size={16} /> Рекомендации ({filteredVideos.length})</>
            )}
          </h3>
        </div>

        {/* Next Videos / Movies / Cartoons List */}
        <div className="video-list">
          {filteredVideos.length === 0 ? (
            <div className="no-videos-found">
              <span>Ничего не найдено по вашему запросу</span>
            </div>
          ) : (
            filteredVideos.map(video => (
              <button
                key={video.id}
                className={`video-item ${video.id === selectedVideo.id ? 'active' : ''} ${video.isKids ? 'kids-item' : ''}`}
                onClick={() => {
                  setSelectedVideo(video);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="video-item-thumb">
                  <img src={video.thumbnail} alt={video.title} />
                  <span className="video-item-duration">{video.duration}</span>
                  {video.rating && (
                    <span className="video-item-rating">★ {video.rating}</span>
                  )}
                  {video.isKids && (
                    <span className="video-item-kids-tag">0+</span>
                  )}
                </div>
                <div className="video-item-info">
                  <p className="video-item-title">{video.title}</p>
                  <p className="video-item-channel">{video.channel.name}</p>
                  <div className="video-item-meta-line">
                    <span>{video.views}</span>
                    <span>•</span>
                    <span>{video.timeAgo}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Upload Video Modal */}
      <UploadVideoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadVideo={handleUploadVideo}
      />
    </div>
  );
}
