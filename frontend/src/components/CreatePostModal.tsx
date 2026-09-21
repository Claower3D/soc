import { useState, useRef } from 'react';
import { X, Image as ImageIcon, MapPin, Sparkles, Compass } from 'lucide-react';
import { type Post } from '../data/mock';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { detectUserCityAndCountry } from '../utils/countryDetect';
import './CreatePostModal.css';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (newPost: Post) => void;
}

export function CreatePostModal({ isOpen, onClose, onCreatePost }: CreatePostModalProps) {
  const { currentUser } = useAuth();
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const compressMediaFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const maxDim = 1280;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressMediaFile(file);
        setSelectedImage(compressed);
      } catch (err) {
        console.warn('Ошибка обработки файла:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage && !caption.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    const postPayload = {
      caption: caption.trim() || 'Новая публикация',
      image: selectedImage || '',
      location: location.trim() || undefined,
    };

    const tempPost: Post = {
      id: `post_${Date.now()}`,
      user: currentUser,
      image: postPayload.image,
      caption: postPayload.caption,
      likes: 1,
      liked: true,
      saved: false,
      comments: [],
      timeAgo: 'Только что',
      location: postPayload.location,
    };

    onCreatePost(tempPost);
    setCaption('');
    setLocation('');
    setSelectedImage(null);
    onClose();

    try {
      const serverRes = await api.posts.create({
        caption: postPayload.caption,
        image: postPayload.image,
        location: postPayload.location || '',
      });
      const createdPost = serverRes?.data || serverRes;
      if (createdPost && (createdPost.id || createdPost.caption)) {
        window.dispatchEvent(new CustomEvent('post_created', { detail: createdPost }));
      }
    } catch (err) {
      console.warn('Сервер вернул предупреждение при сохранении поста:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={e => e.stopPropagation()}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="create-post-header">
          <h3>Создать публикацию</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-post-body">
          {/* User Info */}
          <div className="create-author-bar">
            <img src={currentUser.avatar} alt={currentUser.name} className="author-avatar" />
            <div className="author-meta">
              <span className="author-name">{currentUser.name}</span>
              <span className="author-visibility">🌐 Доступно всем</span>
            </div>
          </div>

          {/* Caption Textarea */}
          <textarea
            placeholder="О чем вы думаете? Поделитесь новостью или мыслями..."
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="caption-textarea"
            rows={4}
            autoFocus
          />

          {/* Image Preview / Upload Area */}
          <div className="image-upload-section">
            {selectedImage ? (
              <div className="preview-container">
                {selectedImage.startsWith('data:video') ? (
                  <video src={selectedImage} controls className="post-preview-img" />
                ) : (
                  <img src={selectedImage} alt="Медиа" className="post-preview-img" />
                )}
                <button 
                  type="button" 
                  className="change-image-btn" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={16} /> Изменить
                </button>
              </div>
            ) : (
              <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={32} className="dropzone-icon" />
                <span>Нажмите, чтобы загрузить фото с компьютера</span>
              </div>
            )}
          </div>

          {/* Location Input */}
          <div className="location-input-row">
            <MapPin size={18} className="loc-icon" />
            <input
              type="text"
              placeholder="Укажите место (город, страна)..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="location-input"
            />
            <button
              type="button"
              className="post-auto-loc-btn"
              disabled={isDetectingLocation}
              onClick={async () => {
                setIsDetectingLocation(true);
                try {
                  const res = await detectUserCityAndCountry();
                  if (res && res.fullLocation) {
                    setLocation(res.fullLocation);
                  }
                } finally {
                  setIsDetectingLocation(false);
                }
              }}
              title="Определить город и страну автоматически"
            >
              <Compass size={13} className={isDetectingLocation ? 'spin-anim' : ''} />
              <span>{isDetectingLocation ? '...' : 'Где я?'}</span>
            </button>
          </div>

          {/* Footer Submit */}
          <div className="create-post-footer">
            <button type="button" className="btn-cancel-post" onClick={onClose}>
              Отмена
            </button>
            <button 
              type="submit" 
              className="btn-publish-post"
              disabled={!selectedImage && !caption.trim()}
            >
              <Sparkles size={16} /> Опубликовать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
