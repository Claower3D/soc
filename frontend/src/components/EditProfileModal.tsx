import { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, MapPin, Globe, Sparkles, Shield, ShoppingBag, 
  Video, User as UserIcon, Check, Image as ImageIcon,
  Flame, Award, Eye, Calendar, Moon, Sun, Compass
} from 'lucide-react';
import { 
  currentUser, type User, type UserRole, type BeliefPrivacy, 
  RELIGIONS_CATALOG 
} from '../data/mock';
import { spiritualAudio } from '../utils/spiritualAudio';
import { calculateZodiacProfile, type ZodiacInfo } from '../utils/astrology';
import { detectUserCityAndCountry } from '../utils/countryDetect';
import { ReligionSymbol } from './ReligionSymbols';
import { ImageCropModal } from './ImageCropModal';
import './EditProfileModal.css';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
}

type EditTab = 'general' | 'astrology' | 'appearance' | 'spiritual' | 'privacy';

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
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [coverImage, setCoverImage] = useState(currentUser.coverImage || SAMPLE_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [online, setOnline] = useState(currentUser.online ?? true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(currentUser.role || 'creator');
  const [beliefType, setBeliefType] = useState<string>(currentUser.beliefType || 'Христианство');
  const [beliefPrivacy, setBeliefPrivacy] = useState<BeliefPrivacy>(currentUser.beliefPrivacy || 'public');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Личные данные: Дата рождения, Знак зодиака, Пол
  const [birthDate, setBirthDate] = useState(currentUser.birthDate || '1995-04-12');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'hidden'>(currentUser.gender || 'male');
  const [showBirthDate, setShowBirthDate] = useState(currentUser.showBirthDate ?? true);
  const [showZodiac, setShowZodiac] = useState(currentUser.showZodiac ?? true);

  // Вычисленные зодиакальные параметры
  const [zodiacInfo, setZodiacInfo] = useState<ZodiacInfo | null>(() => calculateZodiacProfile(currentUser.birthDate || '1995-04-12'));

  useEffect(() => {
    if (birthDate) {
      const info = calculateZodiacProfile(birthDate);
      setZodiacInfo(info);
    } else {
      setZodiacInfo(null);
    }
  }, [birthDate]);

  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCropImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = (croppedUrl: string) => {
    setAvatar(croppedUrl);
    setCropImageUrl(null);
  };

  const handleCropCancel = () => {
    setCropImageUrl(null);
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
      birthDate,
      zodiacSign: zodiacInfo?.sign,
      easternZodiac: zodiacInfo ? `${zodiacInfo.easternElement} ${zodiacInfo.easternSign}` : undefined,
      gender,
      showBirthDate,
      showZodiac
    };

    Object.assign(currentUser, updated);
    spiritualAudio.playCrystalChime();
    onSave(updated);
    onClose();
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      {cropImageUrl && (
        <ImageCropModal 
          imageUrl={cropImageUrl} 
          onCrop={handleCropSave} 
          onCancel={handleCropCancel} 
        />
      )}
      <div className="edit-modal-box" onClick={e => e.stopPropagation()}>
        {/* Hidden inputs for uploading images */}
        <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
        <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverFile} />

        <div className="edit-modal-sidebar">
          <div className="edit-sidebar-header">
            <h2>NEW AGE</h2>
            <h3>НАСТРОЙКИ</h3>
          </div>
          <nav className="edit-sidebar-nav">
            <button 
              type="button"
              className={`edit-tab-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <UserIcon size={16} />
              <span>Профиль</span>
            </button>

            <button 
              type="button"
              className={`edit-tab-item ${activeTab === 'spiritual' ? 'active' : ''}`}
              onClick={() => setActiveTab('spiritual')}
            >
              <Sparkles size={16} />
              <span>Духовный путь</span>
            </button>

            <button 
              type="button"
              className={`edit-tab-item ${activeTab === 'astrology' ? 'active' : ''}`}
              onClick={() => setActiveTab('astrology')}
            >
              <Moon size={16} />
              <span>Астрология</span>
            </button>

            <button 
              type="button"
              className={`edit-tab-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <ImageIcon size={16} />
              <span>Дизайн</span>
            </button>

            <button 
              type="button"
              className={`edit-tab-item ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <Shield size={16} />
              <span>Безопасность</span>
            </button>
          </nav>
        </div>

        <div className="edit-modal-content-area">
          <div className="edit-modal-top-bar">
            <h3 className="edit-modal-main-title">
              {activeTab === 'general' && 'Профиль'}
              {activeTab === 'spiritual' && 'Духовный путь'}
              {activeTab === 'astrology' && 'Астрология'}
              {activeTab === 'appearance' && 'Дизайн'}
              {activeTab === 'privacy' && 'Безопасность'}
            </h3>
            <button className="edit-close-x-btn" onClick={onClose} title="Закрыть">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="edit-form-content">
            {/* ========================================================================= */}
            {/* TAB 1: ПРОФИЛЬ */}
            {/* ========================================================================= */}
            {activeTab === 'general' && (
              <div className="edit-tab-pane">
                
                {/* Photo Upload Card */}
                <div className="edit-photo-card">
                  <img src={avatar} alt="Avatar" className="edit-photo-img" />
                  <div className="edit-photo-info">
                    <span className="edit-photo-label">Фото профиля</span>
                    <button 
                      type="button" 
                      className="btn-change-photo"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      Изменить фото
                    </button>
                  </div>
                </div>

                <div className="edit-field-group">
                  <label className="edit-field-label">@ НИКНЕЙМ</label>
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

                <div className="edit-field-group">
                  <label className="edit-field-label">📞 НОМЕР ТЕЛЕФОНА</label>
                  <input
                    type="tel"
                    placeholder="+7 000 000 00 00"
                    className="edit-input-ctrl"
                    disabled
                    value={currentUser.phone_number || ''}
                    title="Изменение номера телефона пока недоступно"
                  />
                </div>

                <div className="edit-field-group">
                  <label className="edit-field-label">👤 ИМЯ И ФАМИЛИЯ</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Например: Алексей Миронов"
                    className="edit-input-ctrl"
                  />
                </div>

                {/* Bio Field */}
                <div className="edit-field-group">
                  <label className="edit-field-label">О СЕБЕ</label>
                  <textarea
                    rows={4}
                    maxLength={300}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Расскажите о себе, ваших практиках, увлечениях..."
                    className="edit-input-ctrl edit-textarea-ctrl"
                  />
                </div>

                {/* Location & Website */}
                <div className="form-two-cols">
                  <div className="edit-field-group">
                    <div className="edit-field-header-flex">
                      <label className="edit-field-label">📍 Город / Страна</label>
                      <button
                        type="button"
                        className="auto-detect-location-btn"
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
                        <Compass size={12} className={isDetectingLocation ? 'spin-anim' : ''} />
                        {isDetectingLocation ? 'Определяем...' : 'Автоопределить'}
                      </button>
                    </div>
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
                    <label className="edit-field-label">🌐 Веб-сайт / Ссылка</label>
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
          {/* TAB: АСТРОЛОГИЯ И ДАННЫЕ (ДАТА РОЖДЕНИЯ, ЗНАК ЗОДИАКА, ПОЛ) */}
          {/* ========================================================================= */}
          {activeTab === 'astrology' && (
            <div className="edit-tab-pane">
              <div className="astrology-highlight-banner">
                <div className="astro-banner-icon">
                  <Sun size={28} className="astro-sun-icon" />
                </div>
                <div className="astro-banner-info">
                  <h4 className="astro-banner-title">Натальная карта и Знак Зодиака</h4>
                  <p className="astro-banner-desc">
                    Укажите дату рождения, и система автоматически рассчитает ваш западный знак зодиака, 
                    стихию, планету-покровителя и знак восточного календаря.
                  </p>
                </div>
              </div>

              {/* Date of Birth & Gender Fields */}
              <div className="form-two-cols">
                <div className="edit-field-group">
                  <label className="edit-field-label">Дата рождения</label>
                  <div className="input-with-icon-left">
                    <Calendar size={16} className="input-icon-left" />
                    <input
                      type="date"
                      value={birthDate}
                      onChange={e => setBirthDate(e.target.value)}
                      className="edit-input-ctrl has-icon"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <span className="field-hint-text">Используется для расчёта зодиака и возраста</span>
                </div>

                <div className="edit-field-group">
                  <label className="edit-field-label">Пол</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="edit-input-ctrl edit-select-ctrl"
                  >
                    <option value="male">Мужской ♂</option>
                    <option value="female">Женский ♀</option>
                    <option value="other">Другой ✦</option>
                    <option value="hidden">Не указывать / Скрыто</option>
                  </select>
                  <span className="field-hint-text">Отображается в профиле по вашему выбору</span>
                </div>
              </div>

              {/* Live Calculated Astrology Card */}
              {zodiacInfo && (
                <div className="astro-calculated-card">
                  <div className="astro-card-header">
                    <div className="astro-symbol-giant">{zodiacInfo.symbol}</div>
                    <div className="astro-primary-titles">
                      <div className="astro-sign-name">{zodiacInfo.sign}</div>
                      <div className="astro-element-tag">{zodiacInfo.element} • Планета {zodiacInfo.planet}</div>
                    </div>
                    <div className="astro-age-badge">
                      Возраст: <strong>{zodiacInfo.age} лет</strong>
                    </div>
                  </div>

                  <div className="astro-details-grid">
                    <div className="astro-metric-box">
                      <span className="metric-label">Восточный зодиак</span>
                      <strong className="metric-val">{zodiacInfo.easternSign}</strong>
                    </div>
                    <div className="astro-metric-box">
                      <span className="metric-label">Стихия года</span>
                      <strong className="metric-val">{zodiacInfo.easternElement}</strong>
                    </div>
                    <div className="astro-metric-box">
                      <span className="metric-label">Управляющая планета</span>
                      <strong className="metric-val">{zodiacInfo.planet}</strong>
                    </div>
                    <div className="astro-metric-box">
                      <span className="metric-label">Стихия знака</span>
                      <strong className="metric-val">{zodiacInfo.element}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Visibility Settings for Astrology and Birthday */}
              <div className="privacy-settings-box">
                <label className="privacy-toggle-card">
                  <div>
                    <strong className="toggle-heading">Показывать знак зодиака в профиле</strong>
                    <span className="toggle-subtext">Значок зодиака и восточного знака будет виден гостям и друзьям</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showZodiac}
                    onChange={e => setShowZodiac(e.target.checked)}
                    className="custom-switch-check"
                  />
                </label>

                <label className="privacy-toggle-card">
                  <div>
                    <strong className="toggle-heading">Показывать дату рождения и возраст</strong>
                    <span className="toggle-subtext">Отображать день рождения и количество лет в шапке профиля</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showBirthDate}
                    onChange={e => setShowBirthDate(e.target.checked)}
                    className="custom-switch-check"
                  />
                </label>
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

                {/* Custom URL Input for Avatar */}
                <div className="custom-url-row" style={{ marginTop: '1rem' }}>
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={e => setCustomAvatarUrl(e.target.value)}
                    placeholder="Вставьте прямую ссылку на аватар..."
                    className="edit-input-ctrl"
                  />
                  <button 
                    type="button" 
                    className="apply-url-btn"
                    onClick={() => {
                      if (customAvatarUrl.trim()) {
                        setAvatar(customAvatarUrl.trim());
                        setCustomAvatarUrl('');
                        spiritualAudio.playCrystalChime();
                      }
                    }}
                  >
                    Применить
                  </button>
                  <button 
                    type="button" 
                    className="apply-url-btn"
                    style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera size={14} style={{ marginRight: '4px' }}/>
                    С устройства
                  </button>
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
                        <ReligionSymbol id={rel.id} size={34} className="religion-symbol-vector" />
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
              {/* === Password Change Section === */}
              <div className="edit-field-group">
                <label className="edit-field-label">ТЕКУЩИЙ ПАРОЛЬ</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="edit-input-ctrl"
                  placeholder="Введите текущий пароль"
                />
              </div>

              <div className="edit-field-group">
                <label className="edit-field-label">НОВЫЙ ПАРОЛЬ</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="edit-input-ctrl"
                  placeholder="Введите новый пароль"
                />
              </div>

              <div className="edit-field-group">
                <label className="edit-field-label">ПОДТВЕРДИТЕ ПАРОЛЬ</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="edit-input-ctrl"
                  placeholder="Повторите новый пароль"
                />
              </div>

              <button 
                type="button" 
                className="btn-update-password"
                onClick={() => {
                  if (newPassword && newPassword === confirmPassword) {
                    alert('Пароль успешно обновлен!');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  } else if (newPassword !== confirmPassword) {
                    alert('Новые пароли не совпадают!');
                  } else {
                    alert('Введите новый пароль');
                  }
                }}
              >
                <Shield size={16} /> Обновить пароль
              </button>

              <div className="privacy-divider" />

              {/* === Other Privacy Settings === */}
              <div className="privacy-settings-box">
                <label className="privacy-toggle-card">
                  <div>
                    <strong className="toggle-heading">Показывать когда я онлайн (Online)</strong>
                    <span className="toggle-subtext">Скройте свой статус, если не хотите, чтобы другие видели вас в сети</span>
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
                    <strong className="toggle-heading">Получать личные сообщения</strong>
                    <span className="toggle-subtext">Отключите, чтобы запретить всем отправлять вам сообщения в личку</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="custom-switch-check"
                  />
                </label>
              </div>

              <div className="privacy-divider" />

              {/* === Account Actions === */}
              <div className="account-danger-actions">
                <button 
                  type="button" 
                  className="btn-account-logout"
                  onClick={() => {
                    alert('Выход из аккаунта...');
                  }}
                >
                  Выйти
                </button>
                <button 
                  type="button" 
                  className="btn-account-delete"
                  onClick={() => {
                    if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо!')) {
                      alert('Аккаунт удален.');
                    }
                  }}
                >
                  Удалить аккаунт
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL FOOTER ACTION BAR */}
          <div className="edit-modal-footer-single">
            <button type="submit" className="btn-edit-save-massive">
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
