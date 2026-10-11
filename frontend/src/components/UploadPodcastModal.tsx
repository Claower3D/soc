import { useState, useRef } from 'react';
import { X, Headphones, Image as ImageIcon, Sparkles, UploadCloud, Link as LinkIcon, Radio } from 'lucide-react';
import { currentUser, type Podcast } from '../data/mock';
import './UploadPodcastModal.css';

interface UploadPodcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadPodcast: (newPodcast: Podcast, publishToFeed?: boolean) => void;
}

const sampleCovers = [
  'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
];

const podcastCategories = [
  'Духовный путь & Осознанность',
  'Астрология & Эзотерика',
  'Психология & Терапия',
  'Медитации & Звукотерапия',
  'Технологии & IT',
  'Философия & Религия',
  'Бизнес & Саморазвитие',
];

export function UploadPodcastModal({ isOpen, onClose, onUploadPodcast }: UploadPodcastModalProps) {
  const [podcastTitle, setPodcastTitle] = useState('');
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [category, setCategory] = useState(podcastCategories[0]);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('24:30');
  const [cover, setCover] = useState(sampleCovers[0]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [audioInputMode, setAudioInputMode] = useState<'file' | 'url'>('file');
  const [customAudioUrl, setCustomAudioUrl] = useState<string>('');
  const [publishToFeed, setPublishToFeed] = useState<boolean>(true);

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFileName(file.name);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      // Auto-detect audio duration
      const tempAudio = new Audio();
      tempAudio.src = url;
      tempAudio.onloadedmetadata = () => {
        const secs = Math.floor(tempAudio.duration);
        if (!isNaN(secs) && secs > 0) {
          const mins = Math.floor(secs / 60);
          const remSecs = secs % 60;
          setDuration(`${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`);
        }
      };
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCover(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyAudioUrl = () => {
    if (customAudioUrl.trim()) {
      setAudioUrl(customAudioUrl.trim());
      setAudioFileName('Аудио по ссылке');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcastTitle.trim() || !episodeTitle.trim()) return;

    const finalAudio = audioUrl || (audioInputMode === 'url' ? customAudioUrl.trim() : '') || 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg';

    const newPodcast: Podcast = {
      id: `pod_${Date.now()}`,
      title: podcastTitle.trim(),
      author: currentUser.name,
      category,
      cover,
      description: description.trim() || 'Новый выпуск авторского подкаста в New Age.',
      episodes: [
        {
          id: `ep_${Date.now()}`,
          title: episodeTitle.trim(),
          duration: duration || '25:00',
          date: 'Сегодня',
          audioUrl: finalAudio,
        },
      ],
    };

    onUploadPodcast(newPodcast, publishToFeed);
    setPodcastTitle('');
    setEpisodeTitle('');
    setDescription('');
    setAudioUrl('');
    setAudioFileName('');
    setCustomAudioUrl('');
    onClose();
  };

  return (
    <div className="upload-pod-overlay" onClick={onClose}>
      <div className="upload-pod-modal" onClick={e => e.stopPropagation()}>
        {/* Hidden inputs */}
        <input
          ref={coverFileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleCoverFileChange}
        />
        <input
          ref={audioFileInputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleAudioFileChange}
        />

        <div className="upload-pod-header">
          <div className="modal-title-with-icon">
            <div className="pod-icon-badge">
              <Headphones size={20} />
            </div>
            <div>
              <h3>Опубликовать подкаст</h3>
              <p>Создайте новый выпуск, аудио-шоу или медитативную лекцию</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-pod-body">
          {/* Audio Track Selector */}
          <div className="form-row">
            <label className="field-label">Аудиодорожка выпуска</label>
            <div className="audio-source-switch">
              <button 
                type="button" 
                className={`source-tab ${audioInputMode === 'file' ? 'active' : ''}`}
                onClick={() => setAudioInputMode('file')}
              >
                <UploadCloud size={14} /> Загрузить аудиофайл
              </button>
              <button 
                type="button" 
                className={`source-tab ${audioInputMode === 'url' ? 'active' : ''}`}
                onClick={() => setAudioInputMode('url')}
              >
                <LinkIcon size={14} /> Ссылка на MP3 / Поток
              </button>
            </div>

            {audioInputMode === 'file' ? (
              <div 
                className={`audio-dropzone ${audioUrl ? 'has-audio' : ''}`}
                onClick={() => audioFileInputRef.current?.click()}
              >
                {audioUrl ? (
                  <div className="audio-preview-wrapper" onClick={e => e.stopPropagation()}>
                    <div className="audio-track-info">
                      <Radio size={16} className="track-icon" />
                      <span className="file-name">{audioFileName || 'Аудиодорожка прикреплена'}</span>
                      <button 
                        type="button" 
                        className="btn-change-audio"
                        onClick={() => audioFileInputRef.current?.click()}
                      >
                        Заменить
                      </button>
                    </div>
                    <audio src={audioUrl} controls className="modal-audio-preview" />
                  </div>
                ) : (
                  <div className="dropzone-empty-state">
                    <Headphones size={32} className="dropzone-icon" />
                    <span className="dropzone-title">Нажмите для выбора аудиофайла</span>
                    <span className="dropzone-hint">Поддерживаются MP3, WAV, AAC, OGG, M4A</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="audio-url-input-wrap">
                <input
                  type="url"
                  placeholder="Вставьте ссылку на аудиофайл (https://example.com/episode.mp3)..."
                  value={customAudioUrl}
                  onChange={e => setCustomAudioUrl(e.target.value)}
                  className="field-input"
                />
                <button 
                  type="button" 
                  className="btn-apply-url"
                  onClick={handleApplyAudioUrl}
                  disabled={!customAudioUrl.trim()}
                >
                  Применить
                </button>
              </div>
            )}
          </div>

          {/* Podcast Title */}
          <div className="form-row">
            <label className="field-label">Название подкаста (Шоу) *</label>
            <input
              type="text"
              placeholder="Например: Голос Души, Космические Законы, New Age Talks..."
              value={podcastTitle}
              onChange={e => setPodcastTitle(e.target.value)}
              className="field-input"
              autoFocus
              required
            />
          </div>

          {/* Episode Title */}
          <div className="form-row">
            <label className="field-label">Название выпуска *</label>
            <input
              type="text"
              placeholder="Например: Выпуск #1: Как слышать интуицию и жить в потоке"
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
              placeholder="О чем данный выпуск, ключевые инсайты, темы и таймкоды..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="field-textarea"
              rows={2}
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
                  onClick={() => coverFileInputRef.current?.click()}
                >
                  <ImageIcon size={14} /> Выбрать своё фото
                </button>
              </div>
            </div>

            <div className="form-col">
              <label className="field-label">Длительность аудио</label>
              <input
                type="text"
                placeholder="24:30"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="field-input"
              />
              <span className="field-hint">Определяется автоматически при выборе аудиофайла</span>

              <label className="checkbox-feed-label">
                <input 
                  type="checkbox" 
                  checked={publishToFeed}
                  onChange={e => setPublishToFeed(e.target.checked)}
                />
                <span>Опубликовать в общую ленту</span>
              </label>
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
