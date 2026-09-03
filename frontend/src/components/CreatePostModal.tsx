import { useState, useRef } from 'react';
import { X, Image as ImageIcon, MapPin, Sparkles } from 'lucide-react';
import { currentUser, type Post } from '../data/mock';
import './CreatePostModal.css';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (newPost: Post) => void;
}

const sampleImages = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80',
];

export function CreatePostModal({ isOpen, onClose, onCreatePost }: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(sampleImages[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage && !caption.trim()) return;

    const newPost: Post = {
      id: `post_${Date.now()}`,
      user: currentUser,
      image: selectedImage || sampleImages[1],
      caption: caption.trim() || 'Новая публикация',
      likes: 1,
      liked: true,
      saved: false,
      comments: [],
      timeAgo: 'Только что',
      location: location.trim() || undefined,
    };

    onCreatePost(newPost);
    setCaption('');
    setLocation('');
    onClose();
  };

  return (
    <div className="create-post-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={e => e.stopPropagation()}>
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
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
                <img src={selectedImage} alt="Превью" className="post-preview-img" />
                <button 
                  type="button" 
                  className="change-image-btn" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={16} /> Изменить фото
                </button>
              </div>
            ) : (
              <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={32} className="dropzone-icon" />
                <span>Нажмите, чтобы загрузить фото с компьютера</span>
              </div>
            )}

            {/* Quick Templates */}
            <div className="sample-images-row">
              <span className="sample-label">Или выберите тему:</span>
              <div className="samples-grid">
                {sampleImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Пример ${idx}`}
                    className={`sample-thumb ${selectedImage === img ? 'selected' : ''}`}
                    onClick={() => setSelectedImage(img)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Location Input */}
          <div className="location-input-row">
            <MapPin size={18} className="loc-icon" />
            <input
              type="text"
              placeholder="Укажите место (город, заведение)..."
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="location-input"
            />
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
