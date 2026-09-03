import { useState, useRef } from 'react';
import { X, Headphones, Image as ImageIcon, Sparkles, Mic } from 'lucide-react';
import { currentUser, type Podcast } from '../data/mock';
import './UploadPodcastModal.css';

interface UploadPodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadPodcast: (newPodcast: Podcast) => void;
}

const sampleCovers = [
  'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
];

const podcastCategories = [
  'Технологии & IT',
  'Дизайн & Продукт',
  'Бизнес & Стартапы',
  'Искусственный интеллект',
  'Наука и жизнь',
];

export function UploadPodcastModal({ isOpen, onClose, onUploadPodcast }: UploadPodcastModalProps) {
  const [podcastTitle, setPodcastTitle] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [category, setCategory] = useState(podcastCategories[0]);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('32:15');
  const [cover, setCover] = useState(sampleCovers[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCover(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcastTitle.trim() || !episodeTitle.trim()) return;

    const newPodcast: Podcast = {
      id: `pod_${Date.now()}`,
      title: podcastTitle.trim(),
      author: currentUser.name,
      category,
      cover,
      description: description.trim() || 'Новый выпуск авторского подкаста.',
      episodes: [
        {
          id: `ep_${Date.now()}`,
          title: episodeTitle.trim(),
          duration: duration || '30:00',
          date: 'Сегодня',
        },
      ],
    };

    onUploadPodcast(newPodcast);
    setPodcastTitle('');
    setEpisodeTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="upload-pod-overlay" onClick={onClose}>
      <div className="upload-pod-modal" onClick={e => e.stopPropagation()}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="upload-pod-header">
          <div className="modal-title-with-icon">
            <div className="pod-icon-badge">
              <Headphones size={20} />
            </div>
            <div>
              <h3>Опубликовать подкаст</h3>
              <p>Создайте новый аудио-выпуск или подкаст-шоу</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-pod-body">
          {/* Podcast Title */}
          <div className="form-row">
            <label className="field-label">Название подкаста (Шоу)</label>
            <input
              type="text"
              placeholder="Например: Frontend & Architecture, Разговоры о коде..."
              value={podcastTitle}
              onChange={e => setPodcastTitle(e.target.value)}
              className="field-input"
              autoFocus
              required
            />
          </div>

          {/* Episode Title */}
          <div className="form-row">
            <label className="field-label">Название первого выпуска</label>
            <input
              type="text"
              placeholder="Например: Выпуск #1: Тренды веб-разработки 2026"
              value={episodeTitle}
              onChange={e => setEpisodeTitle(e.target.value)}
              className="field-input"
              required
            />
          </div>

          {/* Category */}
          <div className="form-row">
            <label className="field-label">Категория</label>
            <div className="category-select-pills">
              {podcastCategories.map(cat => (
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
            <label className="field-label">Описание выпуска</label>
            <textarea
              placeholder="О чем данный выпуск, ключевые темы..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="field-textarea"
              rows={3}
            />
          </div>

          {/* Cover & Duration */}
          <div className="form-row-split">
            <div className="form-col">
              <label className="field-label">Обложка подкаста</label>
              <div className="thumb-picker-box">
                <img src={cover} alt="Обложка" className="pod-cover-preview" />
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
              <label className="field-label">Длительность аудио</label>
              <input
                type="text"
                placeholder="35:20"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="field-input"
              />
              <div className="audio-upload-hint">
                <Mic size={14} /> Аудиодорожка готова к трансляции
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="upload-pod-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn-submit-pod" 
              disabled={!podcastTitle.trim() || !episodeTitle.trim()}
            >
              <Sparkles size={16} /> Опубликовать подкаст
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
