import { useState, useRef } from 'react';
import { X, Image as ImageIcon, MapPin, Sparkles, Compass } from 'lucide-react';
import { type Post } from '../data/mock';
import { useAuth } from '../context/AuthContext';
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
      image: selectedImage || '',
      caption: caption.trim() || 'РќРѕРІР°СЏ РїСѓР±Р»РёРєР°С†РёСЏ',
      likes: 1,
      liked: true,
      saved: false,
      comments: [],
      timeAgo: 'РўРѕР»СЊРєРѕ С‡С‚Рѕ',
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
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="create-post-header">
          <h3>РЎРѕР·РґР°С‚СЊ РїСѓР±Р»РёРєР°С†РёСЋ</h3>
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
              <span className="author-visibility">рџЊђ Р”РѕСЃС‚СѓРїРЅРѕ РІСЃРµРј</span>
            </div>
          </div>

          {/* Caption Textarea */}
          <textarea
            placeholder="Рћ С‡РµРј РІС‹ РґСѓРјР°РµС‚Рµ? РџРѕРґРµР»РёС‚РµСЃСЊ РЅРѕРІРѕСЃС‚СЊСЋ РёР»Рё РјС‹СЃР»СЏРјРё..."
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
                {selectedImage.startsWith('data:video') ? <video src={selectedImage} controls className="post-preview-img" /> : <img src={selectedImage} alt="Медиа" className="post-preview-img" />}
                <button 
                  type="button" 
                  className="change-image-btn" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={16} /> Изменить</button>
              </div>
            ) : (
              <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={32} className="dropzone-icon" />
                <span>РќР°Р¶РјРёС‚Рµ, С‡С‚РѕР±С‹ Р·Р°РіСЂСѓР·РёС‚СЊ С„РѕС‚Рѕ СЃ РєРѕРјРїСЊСЋС‚РµСЂР°</span>
              </div>
            )}

            </div>

          {/* Location Input */}
          <div className="location-input-row">
            <MapPin size={18} className="loc-icon" />
            <input
              type="text"
              placeholder="РЈРєР°Р¶РёС‚Рµ РјРµСЃС‚Рѕ (РіРѕСЂРѕРґ, СЃС‚СЂР°РЅР°)..."
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
              title="РћРїСЂРµРґРµР»РёС‚СЊ РіРѕСЂРѕРґ Рё СЃС‚СЂР°РЅСѓ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё"
            >
              <Compass size={13} className={isDetectingLocation ? 'spin-anim' : ''} />
              <span>{isDetectingLocation ? '...' : 'Р“РґРµ СЏ?'}</span>
            </button>
          </div>

          {/* Footer Submit */}
          <div className="create-post-footer">
            <button type="button" className="btn-cancel-post" onClick={onClose}>
              РћС‚РјРµРЅР°
            </button>
            <button 
              type="submit" 
              className="btn-publish-post"
              disabled={!selectedImage && !caption.trim()}
            >
              <Sparkles size={16} /> РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

