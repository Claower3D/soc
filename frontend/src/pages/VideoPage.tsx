import { useState } from 'react';
import { Search, Upload, Video as VideoIcon } from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';
import { UploadVideoModal } from '../components/UploadVideoModal';
import { videos, type Video } from '../data/mock';
import './VideoPage.css';

const categories = ['Все', 'Разработка', 'Дизайн', 'Go & Docker', 'React', 'Карьера'];

export function VideoPage() {
  const [videoList, setVideoList] = useState<Video[]>(videos);
  const [selectedVideo, setSelectedVideo] = useState<Video>(videos[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleUploadVideo = (newVideo: Video) => {
    setVideoList(prev => [newVideo, ...prev]);
    setSelectedVideo(newVideo);
  };

  const filteredVideos = videoList.filter(v => {
    const matchesQuery = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         v.channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'Все') return matchesQuery;
    return matchesQuery && (v.title.includes(selectedCategory) || v.description.includes(selectedCategory));
  });

  return (
    <div className="video-page">
      <div className="video-main">
        <VideoPlayer video={selectedVideo} />
      </div>

      <aside className="video-sidebar">
        {/* Upload Button */}
        <div className="video-upload-top-action">
          <button 
            className="btn-upload-video-trigger"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload size={16} />
            <span>Загрузить своё видео</span>
          </button>
        </div>

        {/* Search Bar in Video Section */}
        <div className="video-sidebar-search">
          <Search size={16} className="video-search-icon" />
          <input
            type="text"
            placeholder="Поиск по видео..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="video-search-input"
          />
        </div>

        {/* Categories Chips */}
        <div className="video-categories-scroll">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <h3 className="video-sidebar-title">
          <VideoIcon size={16} /> Все видеоролики ({filteredVideos.length})
        </h3>

        <div className="video-list">
          {filteredVideos.length === 0 ? (
            <div className="no-videos-found">
              <span>Видео не найдены</span>
            </div>
          ) : (
            filteredVideos.map(video => (
              <button
                key={video.id}
                className={`video-item ${video.id === selectedVideo.id ? 'active' : ''}`}
                onClick={() => setSelectedVideo(video)}
              >
                <div className="video-item-thumb">
                  <img src={video.thumbnail} alt={video.title} />
                  <span className="video-item-duration">{video.duration}</span>
                </div>
                <div className="video-item-info">
                  <p className="video-item-title">{video.title}</p>
                  <p className="video-item-channel">{video.channel.name}</p>
                  <p className="video-item-meta">{video.views} · {video.timeAgo}</p>
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
