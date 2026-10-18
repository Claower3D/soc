import { useState, useRef } from 'react';
import { X, Video, Image as ImageIcon, Sparkles, UploadCloud, Link as LinkIcon, Film } from 'lucide-react';
import { currentUser, type Video as VideoType } from '../data/mock';
import { api } from '../api';
import './UploadVideoModal.css';

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadVideo: (newVideo: VideoType, publishToFeed?: boolean) => void;
}

const sampleThumbnails: string[] = [];
const categories = [
  'Духовный рост',
  'Медитации & Практики',
  'Астрология & Таро',
  'Психология',
  'Осознанность',
  'Разработка',
  'Дизайн & Творчество',
  'Обучение'
];

export function UploadVideoModal({ isOpen, onClose, onUploadVideo }: UploadVideoModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('14:30');
  const [thumbnail, setThumbnail] = useState<string>(sampleThumbnails[0]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [videoInputMode, setVideoInputMode] = useState<'file' | 'url'>('file');
  const [customVideoUrl, setCustomVideoUrl] = useState<string>('');
  const [rawVideoFile, setRawVideoFile] = useState<File | null>(null);
  const [rawThumbFile, setRawThumbFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [publishToFeed, setPublishToFeed] = useState<boolean>(true);

  const thumbFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRawThumbFile(file);
      setVideoFileName(file.name);
      setRawVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);

      // Auto-detect duration and thumbnail frame
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        const secs = Math.floor(tempVideo.duration);
        if (!isNaN(secs) && secs > 0) {
          const mins = Math.floor(secs / 60);
          const remSecs = secs % 60;
          setDuration(`${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`);
        }
        tempVideo.currentTime = Math.min(1.5, Math.max(0.5, tempVideo.duration / 3));
      };
      tempVideo.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = tempVideo.videoWidth || 640;
          canvas.height = tempVideo.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            const captured = canvas.toDataURL('image/jpeg', 0.85);
            setThumbnail(captured);
          }
        } catch {
          // ignore canvas capture fallback
        }
      };
    }
  };

  const handleThumbFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnail(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = () => {
    if (customVideoUrl.trim()) {
      setVideoUrl(customVideoUrl.trim());
      setVideoFileName('Видео по ссылке');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isUploading) return;

    if (videoInputMode === 'file') {
      if (!rawVideoFile) {
        alert('Пожалуйста, выберите видеофайл для загрузки');
        return;
      }
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('video', rawVideoFile);
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('category', category);
        formData.append('duration', duration || '10:00');
        if (rawThumbFile) {
          formData.append('thumbnail', rawThumbFile);
        }

        const res = await api.videos.create(formData);
        const serverVideoUrl = res?.videoUrl || '';
        const serverThumbnail = res?.thumbnail || thumbnail || '';

        const newVideo: VideoType = {
          id: res?.id || `vid_${Date.now()}`,
          title: title.trim(),
          channel: currentUser,
          thumbnail: serverThumbnail,
          videoUrl: serverVideoUrl,
          views: '1 просмотр',
          duration: duration || '10:00',
          timeAgo: 'Только что',
          description: `${category} · ${description.trim() || 'Новое авторское видео на платформе.'}`,
          likesCount: 1,
          category,
          type: 'video',
        };

        onUploadVideo(newVideo, publishToFeed);
        setTitle('');
        setDescription('');
        setVideoUrl('');
        setVideoFileName('');
        setRawVideoFile(null);
        setRawThumbFile(null);
        onClose();
      } catch (err: any) {
        console.error('Ошибка загрузки видео:', err);
        alert('Ошибка при загрузке видео: ' + (err?.message || 'Попробуйте снова'));
      } finally {
        setIsUploading(false);
      }
    } else {
      if (!customVideoUrl.trim()) {
        alert('Пожалуйста, укажите ссылку на видео');
        return;
      }
      setIsUploading(true);
      try {
        const res = await api.videos.create({
          title: title.trim(),
          description: description.trim(),
          category,
          duration: duration || '10:00',
          videoUrl: customVideoUrl.trim(),
          thumbnail: thumbnail || ''
        });

        const newVideo: VideoType = {
          id: res?.id || `vid_${Date.now()}`,
          title: title.trim(),
          channel: currentUser,
          thumbnail: thumbnail || '',
          videoUrl: customVideoUrl.trim(),
          views: '1 просмотр',
          duration: duration || '10:00',
          timeAgo: 'Только что',
          description: `${category} · ${description.trim() || 'Новое авторское видео на платформе.'}`,
          likesCount: 1,
          category,
          type: 'video',
        };

        onUploadVideo(newVideo, publishToFeed);
        setTitle('');
        setDescription('');
        setCustomVideoUrl('');
        onClose();
      } catch (err: any) {
        console.error('Ошибка создания видео:', err);
        alert('Ошибка при сохранении видео: ' + (err?.message || 'Попробуйте снова'));
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="upload-video-overlay" onClick={onClose}>
      <div className="upload-video-modal" onClick={e => e.stopPropagation()}>
        {/* Hidden inputs */}
        <input
          ref={thumbFileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleThumbFileChange}
        />
        <input
          ref={videoFileInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={handleVideoFileChange}
        />

        <div className="upload-video-header">
          <div className="modal-title-with-icon">
            <div className="video-icon-badge">
              <Video size={20} />
            </div>
            <div>
              <h3>Опубликовать видео</h3>
              <p>Загрузите видеоролик на канал или поделитесь им в ленте</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="upload-video-body">
          {/* Video File / Link Selection */}
          <div className="form-row">
            <div className="video-source-switch">
              <button 
                type="button" 
                className={`source-tab ${videoInputMode === 'file' ? 'active' : ''}`}
                onClick={() => setVideoInputMode('file')}
              >
                <UploadCloud size={14} /> Файл с устройства
              </button>
              <button 
                type="button" 
                className={`source-tab ${videoInputMode === 'url' ? 'active' : ''}`}
                onClick={() => setVideoInputMode('url')}
              >
                <LinkIcon size={14} /> Ссылка на видео (URL)
              </button>
            </div>

            {videoInputMode === 'file' ? (
              <div 
                className={`video-dropzone ${videoUrl ? 'has-video' : ''}`}
                onClick={() => videoFileInputRef.current?.click()}
              >
                {videoUrl ? (
                  <div className="video-preview-wrapper" onClick={e => e.stopPropagation()}>
                    <video src={videoUrl} controls className="modal-video-preview" />
                    <div className="video-info-bar">
                      <Film size={14} />
                      <span className="file-name">{videoFileName || 'Видео выбрано'}</span>
                      <button 
                        type="button" 
                        className="btn-change-video"
                        onClick={() => videoFileInputRef.current?.click()}
                      >
                        Заменить
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="dropzone-empty-state">
                    <UploadCloud size={34} className="dropzone-icon" />
                    <span className="dropzone-title">Нажмите для выбора видеофайла</span>
                    <span className="dropzone-hint">Поддерживаются MP4, WebM, MOV, AVI</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="video-url-input-wrap">
                <input
                  type="url"
                  placeholder="Вставьте прямую ссылку на видео (например: https://example.com/video.mp4)..."
                  value={customVideoUrl}
                  onChange={e => setCustomVideoUrl(e.target.value)}
                  className="field-input"
                />
                <button 
                  type="button" 
                  className="btn-apply-url"
                  onClick={handleApplyUrl}
                  disabled={!customVideoUrl.trim()}
                >
                  Применить
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="form-row">
            <label className="field-label">Название видео *</label>
            <input
              type="text"
              placeholder="Например: Практика осознанности и медитация для начинающих..."
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
              placeholder="Расскажите подробнее, о чем ваше видео, добавьте полезные ссылки и таймкоды..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="field-textarea"
              rows={2}
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
                  onClick={() => thumbFileInputRef.current?.click()}
                >
                  <ImageIcon size={14} /> Загрузить обложку
                </button>
              </div>
            </div>

            <div className="form-col">
              <label className="field-label">Длительность</label>
              <input
                type="text"
                placeholder="Например: 14:30"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="field-input"
              />
              <span className="field-hint">Определяется автоматически при выборе видео</span>

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
