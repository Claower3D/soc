import { useState, useRef } from 'react';
import { 
  X, Camera, MapPin, Globe, Sparkles, Shield, ShoppingBag, 
  Video, User as UserIcon, Check, Image as ImageIcon,
  Flame, Award, Eye
} from 'lucide-react';
import { 
  currentUser, type User, type UserRole, type BeliefPrivacy, 
  RELIGIONS_CATALOG 
} from '../data/mock';
import { spiritualAudio } from '../utils/spiritualAudio';
import './EditProfileModal.css';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

type EditTab = 'general' | 'appearance' | 'spiritual' | 'privacy';

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
];

const SAMPLE_COVERS = [
  {
    title: 'Космический New Age',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Океан Тишины',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Вершины Алтая',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Звездный Путь',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Озеро на Рассвете',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Кибер Неон',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Туманный Лес',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Солнечные Лучи',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80'
  }
];

export function EditProfileModal({ isOpen, onClose, onSave }: EditProfileModalProps) {
  const [activeTab, setActiveTab] = useState<EditTab>('general');
  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [coverImage, setCoverImage] = useState(currentUser.coverImage || SAMPLE_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [online, setOnline] = useState(currentUser.online ?? true);
  const [role, setRole] = useState<UserRole>(currentUser.role || 'creator');
  const [beliefType, setBeliefType] = useState<string>(currentUser.beliefType || 'Христианство');
  const [beliefPrivacy, setBeliefPrivacy] = useState<BeliefPrivacy>(currentUser.beliefPrivacy || 'public');

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

  const handleApplyCustomCover = () => {
    if (customCoverUrl.trim()) {
      setCoverImage(customCoverUrl.trim());
      setCustomCoverUrl('');
      spiritualAudio.playCrystalChime();
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
      role,
      beliefType,
      beliefPrivacy,
    };

    Object.assign(currentUser, updated);
    spiritualAudio.playCrystalChime();
    onSave(updated);
    onClose();
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-box" onClick={e => e.stopPropagation()}>
        {/* Hidden inputs for uploading images */}
        <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverFile} />

        {/* Modal Header with Tabs */}
        <div className="edit-modal-top-bar">
          <div>
            <h3 className="edit-modal-main-title">Редактировать профиль</h3>
            <p className="edit-modal-subtitle">Настройте внешний вид, личные данные и духовный статус</p>
          </div>
          <button className="edit-close-x-btn" onClick={onClose} title="Закрыть">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="edit-modal-nav-tabs">
          <button 
            type="button"
            className={`edit-tab-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <UserIcon size={16} />
            <span>Основное</span>
          </button>

          <button 
            type="button"
            className={`edit-tab-item ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <ImageIcon size={16} />
            <span>Обложка и Аватар</span>
          </button>

          <button 
            type="button"
            className={`edit-tab-item ${activeTab === 'spiritual' ? 'active' : ''}`}
            onClick={() => setActiveTab('spiritual')}
          >
            <Sparkles size={16} />
            <span>Конфессия и Роль</span>
          </button>

          <button 
            type="button"
            className={`edit-tab-item ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Shield size={16} />
            <span>Приватность</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="edit-form-content">
          {/* ========================================================================= */}
          {/* TAB 1: ОСНОВНОЕ */}
          {/* ========================================================================= */}
          {activeTab === 'general' && (
            <div className="edit-tab-pane">
              <div className="form-two-cols">
                <div className="edit-field-group">
                  <label className="edit-field-label">Имя и Фамилия *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Например: Алексей Миронов"
                    className="edit-input-ctrl"
                  />
                </div>

                <div className="edit-field-group">
                  <label className="edit-field-label">Имя пользователя (Никнейм) *</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">@</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="alex_mironov"
                      className="edit-input-ctrl prefix-input"
                    />
                  </div>
                </div>
              </div>

              {/* Bio Field with Char Counter */}
              <div className="edit-field-group">
                <div className="label-with-counter">
                  <label className="edit-field-label">О себе (Био)</label>
                  <span className={`char-counter ${bio.length > 280 ? 'warn' : ''}`}>
                    {bio.length} / 300
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={300}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Расскажите о себе, ваших практиках, увлечениях и философии жизни..."
                  className="edit-input-ctrl edit-textarea-ctrl"
                />

                {/* Quick Bio Tag Pills */}
                <div className="bio-quick-tags">
                  <span className="tags-hint">Быстрые теги:</span>
                  {[
                    '🧘 Хатха-йога', 
                    '✨ Медитации 432 Гц', 
                    '📚 Самопознание', 
                    '🌿 Осознанность', 
                    '☀️ Аффирмации', 
                    '🎵 Саундхилинг'
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className="bio-tag-chip"
                      onClick={() => {
                        if (bio.length + tag.length + 1 <= 300) {
                          setBio(prev => prev ? `${prev} ${tag}` : tag);
                        }
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location & Website */}
              <div className="form-two-cols">
                <div className="edit-field-group">
                  <label className="edit-field-label">Город / Страна</label>
                  <div className="input-with-icon-left">
                    <MapPin size={16} className="input-icon-left" />
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Санкт-Петербург, Россия"
                      className="edit-input-ctrl has-icon"
                    />
                  </div>
                </div>

                <div className="edit-field-group">
                  <label className="edit-field-label">Веб-сайт / Ссылка</label>
                  <div className="input-with-icon-left">
                    <Globe size={16} className="input-icon-left" />
                    <input
                      type="url"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="https://t.me/my_channel"
                      className="edit-input-ctrl has-icon"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ОБЛОЖКА И АВАТАР */}
          {/* ========================================================================= */}
          {activeTab === 'appearance' && (
            <div className="edit-tab-pane">
              {/* Real-time Interactive Profile Header Preview */}
              <div className="live-header-preview-card">
                <div 
                  className="preview-cover-bg"
                  style={{ backgroundImage: `url(${coverImage})` }}
                >
                  <button 
                    type="button" 
                    className="change-cover-floating-btn"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <Camera size={14} />
                    <span>Загрузить с устройства</span>
                  </button>
                </div>

                <div className="preview-avatar-row">
                  <div className="preview-avatar-wrapper">
                    <img src={avatar} alt="Avatar" className="preview-avatar-img" />
                    <button 
                      type="button" 
                      className="change-avatar-floating-btn"
                      onClick={() => avatarInputRef.current?.click()}
                      title="Загрузить фото"
                    >
                      <Camera size={14} />
                    </button>
                  </div>

                  <div className="preview-profile-info">
                    <div className="preview-name">{name || 'Имя Фамилия'}</div>
                    <div className="preview-handle">@{username || 'username'} · <span className="preview-badge-pill">{role}</span></div>
                  </div>
                </div>
              </div>

              {/* Ready Covers Gallery */}
              <div className="gallery-section">
                <label className="edit-field-label">Готовые дизайнерские обложки New Age</label>
                <div className="covers-mosaic-grid">
                  {SAMPLE_COVERS.map(cov => (
                    <div 
                      key={cov.url}
                      className={`cover-thumb-item ${coverImage === cov.url ? 'selected' : ''}`}
                      onClick={() => {
                        setCoverImage(cov.url);
                        spiritualAudio.playCrystalChime();
                      }}
                    >
                      <img src={cov.url} alt={cov.title} />
                      <span className="cover-thumb-title">{cov.title}</span>
                      {coverImage === cov.url && (
                        <span className="selected-check-badge">
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Custom URL Input for Cover */}
                <div className="custom-url-row">
                  <input
                    type="url"
                    value={customCoverUrl}
                    onChange={e => setCustomCoverUrl(e.target.value)}
                    placeholder="Вставьте прямую ссылку на любую картинку в интернете..."
                    className="edit-input-ctrl"
                  />
                  <button 
                    type="button" 
                    className="apply-url-btn"
                    onClick={handleApplyCustomCover}
                  >
                    Применить
                  </button>
                </div>
              </div>

              {/* Ready Avatars Gallery */}
              <div className="gallery-section">
                <label className="edit-field-label">Выбрать готовый аватар</label>
                <div className="avatars-scroll-strip">
                  {SAMPLE_AVATARS.map((av, idx) => (
                    <div 
                      key={idx} 
                      className={`avatar-sample-item ${avatar === av ? 'selected' : ''}`}
                      onClick={() => {
                        setAvatar(av);
                        spiritualAudio.playCrystalChime();
                      }}
                    >
                      <img src={av} alt="Avatar option" />
                      {avatar === av && <Check size={14} className="avatar-check-mark" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ДУХОВНЫЙ ПУТЬ И РОЛЬ */}
          {/* ========================================================================= */}
          {activeTab === 'spiritual' && (
            <div className="edit-tab-pane">
              {/* Role in ecosystem */}
              <div className="edit-field-group">
                <label className="edit-field-label">Ваша роль в экосистеме New Age</label>
                <div className="roles-cards-grid">
                  {[
                    { id: 'user', title: 'Личный профиль', desc: 'Участник, читатель, практик', icon: UserIcon, color: '#3B82F6' },
                    { id: 'creator', title: 'Автор контента', desc: 'Создание постов, видео и подкастов', icon: Video, color: '#10B981' },
                    { id: 'expert', title: 'Эксперт / Мастер', desc: 'Преподаватель йоги, медитаций, коуч', icon: Award, color: '#8B5CF6' },
                    { id: 'critic', title: 'Критик', desc: 'Аналитика, рецензии и открытые дискуссии', icon: Flame, color: '#F59E0B' },
                    { id: 'business', title: 'Бизнес / Магазин', desc: 'Продажа товаров, книг и атрибутики', icon: ShoppingBag, color: '#EC4899' },
                  ].map(r => {
                    const Icon = r.icon;
                    const isSelected = role === r.id;
                    return (
                      <div 
                        key={r.id}
                        className={`role-choice-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setRole(r.id as UserRole)}
                      >
                        <div className="role-icon-box" style={{ background: `${r.color}15`, color: r.color }}>
                          <Icon size={18} />
                        </div>
                        <div className="role-text-box">
                          <strong className="role-title">{r.title}</strong>
                          <span className="role-desc">{r.desc}</span>
                        </div>
                        {isSelected && <Check size={16} className="role-checked-icon" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Religious Confession / Spiritual Path Cards */}
              <div className="edit-field-group">
                <div className="label-with-privacy">
                  <label className="edit-field-label">Мировоззрение / Конфессия (12 путей)</label>
                  <div className="privacy-select-wrapper">
                    <Eye size={14} className="privacy-eye-icon" />
                    <span>Кто видит:</span>
                    <select
                      value={beliefPrivacy}
                      onChange={e => setBeliefPrivacy(e.target.value as BeliefPrivacy)}
                      className="privacy-select"
                    >
                      <option value="public">Всем</option>
                      <option value="followers">Только подписчикам</option>
                      <option value="private">Только мне</option>
                    </select>
                  </div>
                </div>

                <div className="religions-cards-mosaic">
                  {RELIGIONS_CATALOG.map(rel => {
                    const isSelected = beliefType === rel.name;
                    return (
                      <div 
                        key={rel.id}
                        className={`religion-mini-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setBeliefType(rel.name);
                          spiritualAudio.playCrystalChime();
                        }}
                      >
                        <img 
                          src={rel.iconImg} 
                          alt={rel.symbolTitle} 
                          className="religion-symbol-img"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="rel-text-meta">
                          <strong className="rel-name">{rel.name}</strong>
                          <span className="rel-symbol-title">{rel.symbolTitle}</span>
                        </div>
                        {isSelected && <Check size={16} className="rel-checked-icon" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ПРИВАТНОСТЬ И УВЕДОМЛЕНИЯ */}
          {/* ========================================================================= */}
          {activeTab === 'privacy' && (
            <div className="edit-tab-pane">
              <div className="privacy-settings-box">
                <label className="privacy-toggle-card">
                  <div>
                    <strong className="toggle-heading">Статус «В сети» (Online)</strong>
                    <span className="toggle-subtext">Показывать зелёный индикатор активности в профиле и мессенджере</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={online}
                    onChange={e => setOnline(e.target.checked)}
                    className="custom-switch-check"
                  />
                </label>

                <label className="privacy-toggle-card">
                  <div>
                    <strong className="toggle-heading">Приём личных сообщений</strong>
                    <span className="toggle-subtext">Разрешать пользователям без взаимной подписки писать вам в чат</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="custom-switch-check"
                  />
                </label>

                <label className="privacy-toggle-card">
                  <div>
                    <strong className="toggle-heading">Участие в рейтинге осознанности</strong>
                    <span className="toggle-subtext">Отображать накопленные минуты медитации в общей таблице практиков</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="custom-switch-check"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL FOOTER ACTION BAR */}
          {/* ========================================================================= */}
          <div className="edit-modal-footer">
            <div className="footer-left-status">
              <span className="status-dot-emerald" />
              <span>Все изменения готовы к сохранению</span>
            </div>

            <div className="footer-actions-group">
              <button type="button" className="btn-edit-cancel" onClick={onClose}>
                Отмена
              </button>

              <button type="submit" className="btn-edit-save">
                <Sparkles size={16} />
                <span>Сохранить профиль</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
