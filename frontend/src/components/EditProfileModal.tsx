import { useState, useRef } from 'react';
import { X, Camera, MapPin, Globe, Sparkles } from 'lucide-react';
import { currentUser, type User } from '../data/mock';
import './EditProfileModal.css';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

const sampleAvatars = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
];

const sampleCovers = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
];

export function EditProfileModal({ isOpen, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [coverImage, setCoverImage] = useState(currentUser.coverImage || sampleCovers[0]);
  const [online, setOnline] = useState(currentUser.online ?? true);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCoverImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      username: username.trim().replace('@', '') || currentUser.username,
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim(),
      avatar,
      coverImage,
      online,
    };

    // Update global object
    Object.assign(currentUser, updated);
    onSave(updated);
    onClose();
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-box" onClick={e => e.stopPropagation()}>
        {/* Hidden inputs */}
        <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverFile} />

        <div className="edit-modal-header">
          <h3>Редактировать профиль</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-modal-body">
          {/* Cover & Avatar Header Section */}
          <div className="edit-covers-section">
            <div className="edit-cover-preview">
              <img src={coverImage} alt="Обложка" />
              <button 
                type="button" 
                className="btn-change-cover"
                onClick={() => coverInputRef.current?.click()}
              >
                <Camera size={14} /> Сменить обложку
              </button>
            </div>

            <div className="edit-avatar-container">
              <div className="edit-avatar-wrap">
                <img src={avatar} alt="Аватар" className="edit-avatar-img" />
                <button 
                  type="button" 
                  className="btn-avatar-cam"
                  onClick={() => avatarInputRef.current?.click()}
                  title="Загрузить новое фото"
                >
                  <Camera size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Avatar Templates */}
          <div className="quick-templates-row">
            <span className="templates-label">Готовые аватары:</span>
            <div className="templates-list">
              {sampleAvatars.map((url, idx) => (
                <img 
                  key={idx} 
                  src={url} 
                  alt={`Аватар ${idx}`} 
                  className={`template-avatar ${avatar === url ? 'selected' : ''}`}
                  onClick={() => setAvatar(url)}
                />
              ))}
            </div>
          </div>

          {/* Name & Username Fields */}
          <div className="edit-fields-grid">
            <div className="edit-form-group">
              <label className="edit-label">Имя и Фамилия</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="edit-input"
                required
              />
            </div>

            <div className="edit-form-group">
              <label className="edit-label">Имя пользователя (Никнейм)</label>
              <div className="edit-input-prefix">
                <span>@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="edit-input-unprefixed"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="edit-form-group">
            <label className="edit-label">О себе (Био)</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="edit-textarea"
              rows={3}
              placeholder="Расскажите о себе, своих интересах и проектах..."
            />
          </div>

          {/* Location & Website */}
          <div className="edit-fields-grid">
            <div className="edit-form-group">
              <label className="edit-label">Город / Страна</label>
              <div className="edit-input-icon-wrap">
                <MapPin size={16} className="input-icon" />
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="edit-input-with-icon"
                  placeholder="Москва, Россия"
                />
              </div>
            </div>

            <div className="edit-form-group">
              <label className="edit-label">Веб-сайт / Ссылка</label>
              <div className="edit-input-icon-wrap">
                <Globe size={16} className="input-icon" />
                <input
                  type="text"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="edit-input-with-icon"
                  placeholder="https://github.com/..."
                />
              </div>
            </div>
          </div>

          {/* Online Toggle */}
          <div className="edit-toggle-row">
            <div>
              <strong>Статус «В сети»</strong>
              <p>Показывать зелёный индикатор активности в профиле и мессенджере</p>
            </div>
            <label className="switch-toggle">
              <input 
                type="checkbox" 
                checked={online} 
                onChange={e => setOnline(e.target.checked)} 
              />
              <span className="slider-round" />
            </label>
          </div>

          {/* Footer */}
          <div className="edit-modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-save-profile">
              <Sparkles size={16} /> Сохранить профиль
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
