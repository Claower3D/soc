import { useState, useRef } from 'react';
import { X, Tv, Camera, Globe, Sparkles } from 'lucide-react';
import type { User } from '../data/mock';
import './EditChannelModal.css';

interface EditChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelUser: User;
  onSaveChannel: (updatedChannel: {
    title: string;
    handle: string;
    bio: string;
    website: string;
    banner: string;
    avatar: string;
  }) => void;
}

const sampleBanners = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=80',
];

export function EditChannelModal({ isOpen, onClose, channelUser, onSaveChannel }: EditChannelModalProps) {
  const [channelTitle, setChannelTitle] = useState(channelUser.name);
  const [handle, setHandle] = useState(channelUser.username);
  const [channelBio, setChannelBio] = useState(
    channelUser.bio || 'Официальный видеоканал: уроки по программированию, стримы и обзоры технологий.'
  );
  const [website, setWebsite] = useState(channelUser.website || 'https://github.com/alex-demo');
  const [banner, setBanner] = useState(channelUser.coverImage || sampleBanners[0]);
  const [avatar, setAvatar] = useState(channelUser.avatar);

  const bannerFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleBannerFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setBanner(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveChannel({
      title: channelTitle.trim() || channelUser.name,
      handle: handle.trim().replace('@', '') || channelUser.username,
      bio: channelBio.trim(),
      website: website.trim(),
      banner,
      avatar,
    });
    onClose();
  };

  return (
    <div className="edit-channel-overlay" onClick={onClose}>
      <div className="edit-channel-box" onClick={e => e.stopPropagation()}>
        <input ref={bannerFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBannerFile} />
        <input ref={avatarFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />

        <div className="edit-channel-header">
          <div className="channel-modal-title">
            <div className="channel-tv-badge">
              <Tv size={20} />
            </div>
            <div>
              <h3>Настройка вида канала</h3>
              <p>Настройте брендинг, шапку и основную информацию для зрителей</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-channel-body">
          {/* Channel Banner Editor */}
          <div className="form-group">
            <label className="field-label">Баннер канала (Шапка)</label>
            <div className="channel-banner-edit-box">
              <img src={banner} alt="Баннер" className="banner-preview" />
              <button 
                type="button" 
                className="btn-upload-banner"
                onClick={() => bannerFileRef.current?.click()}
              >
                <Camera size={14} /> Загрузить свой баннер
              </button>
            </div>

            {/* Banner Presets */}
            <div className="banner-presets-row">
              <span className="presets-label">Готовые темы:</span>
              <div className="presets-grid">
                {sampleBanners.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Тема ${idx}`}
                    className={`preset-thumb ${banner === img ? 'active' : ''}`}
                    onClick={() => setBanner(img)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Channel Title & Handle */}
          <div className="form-row-split">
            <div className="form-group">
              <label className="field-label">Название канала</label>
              <input
                type="text"
                value={channelTitle}
                onChange={e => setChannelTitle(e.target.value)}
                className="field-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="field-label">Идентификатор канала (Handle)</label>
              <div className="handle-input-box">
                <span>@</span>
                <input
                  type="text"
                  value={handle}
                  onChange={e => setHandle(e.target.value)}
                  className="handle-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Channel Bio */}
          <div className="form-group">
            <label className="field-label">Описание канала (О канале)</label>
            <textarea
              value={channelBio}
              onChange={e => setChannelBio(e.target.value)}
              rows={3}
              className="field-textarea"
              placeholder="Расскажите зрителям, какой контент вы публикуете..."
            />
          </div>

          {/* Channel Website */}
          <div className="form-group">
            <label className="field-label">Официальная ссылка / Соцсети</label>
            <div className="link-input-box">
              <Globe size={16} className="input-icon" />
              <input
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="link-input"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="edit-channel-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-save-channel">
              <Sparkles size={16} /> Сохранить настройки канала
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
