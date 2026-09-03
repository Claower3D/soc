import { useState, useRef } from 'react';
import { X, Video, Image as ImageIcon, Sparkles } from 'lucide-react';
import { currentUser, type Video as VideoType } from '../data/mock';
import './UploadVideoModal.css';

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadVideo: (newVideo: VideoType) => void;
}

const sampleThumbnails = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
];

const categories = ['Разработка', 'Дизайн', 'Go & Docker', 'React', 'Карьера', 'Обучение'];

export function UploadVideoModal({ isOpen, onClose, onUploadVideo }: UploadVideoModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('14:30');
  const [thumbnail, setThumbnail] = useState<string>(sampleThumbnails[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnail(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newVideo: VideoType = {
      id: `vid_${Date.now()}`,
      title: title.trim(),
      channel: currentUser,
      thumbnail: thumbnail || sampleThumbnails[0],
      views: '1 просмотр',
      duration: duration || '12:40',
      timeAgo: 'Только что',
      description: `${category} · ${description.trim() || 'Новое авторское видео на платформе.'}`,
      likesCount: 1,
    };

    onUploadVideo(newVideo);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="upload-video-overlay" onClick={onClose}>
      <div className="upload-video-modal" onClick={e => e.stopPropagation()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="upload-video-header">
          <div className="modal-title-with-icon">
            <div className="video-icon-badge">
              <Video size={20} />
            </div>
            <div>
              <h3>Загрузить видео</h3>
              <p>Опубликуйте обучающее видео или ролик на канал</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-video-body">
          {/* Title */}
          <div className="form-row">
            <label className="field-label">Название видео</label>
            <input
              type="text"
              placeholder="Например: Обзор React 19 и Go микросервисов..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="field-input"
              autoFocus
              required
            />
          </div>

          {/* Category */}
          <div className="form-row">
            <label className="field-label">Категория</label>
            <div className="category-select-pills">
              {categories.map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={`cat-pill ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-row">
            <label className="field-label">Описание ролика</label>
            <textarea
              placeholder="Расскажите подробнее, о чем ваше видео..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="field-textarea"
              rows={3}
            />
          </div>

          {/* Thumbnail & Duration */}
          <div className="form-row-split">
            <div className="form-col">
              <label className="field-label">Обложка видео (Thumbnail)</label>
              <div className="thumb-picker-box">
                <img src={thumbnail} alt="Превью" className="current-thumb" />
                <button 
                  type="button" 
                  className="btn-change-thumb"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={14} /> Выбрать своё фото
                </button>
              </div>
            </div>

            <div className="form-col">
              <label className="field-label">Длительность</label>
              <input
                type="text"
                placeholder="Например: 18:45"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="field-input"
              />
              <span className="field-hint">Формат: MM:SS или HH:MM:SS</span>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="upload-video-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-submit-video" disabled={!title.trim()}>
              <Sparkles size={16} /> Опубликовать видео
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
