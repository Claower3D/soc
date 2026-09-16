import React, { useState } from 'react';
import { 
  X, Camera, Plus, Trash2, Check, Sparkles, 
  Target, Award, Compass, User
} from 'lucide-react';
import { 
  type DatingProfile, 
  type DatingGoalType, 
  DATING_GOALS, 
  POPULAR_INTERESTS_TAGS 
} from '../data/datingData';
import './EditDatingProfileModal.css';

interface EditDatingProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: DatingProfile) => void;
  initialProfile?: DatingProfile | null;
}

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
];

export const EditDatingProfileModal: React.FC<EditDatingProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProfile
}) => {
  const [name, setName] = useState(initialProfile?.name || 'Александр Новиков');
  const [age, setAge] = useState(initialProfile?.age || 28);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(initialProfile?.gender || 'male');
  const [city, setCity] = useState(initialProfile?.city || 'Москва');
  const [occupation, setOccupation] = useState(initialProfile?.occupation || 'Инженер & Практик');
  const [bio, setBio] = useState(initialProfile?.bio || 'Ищу родственную душу для честного общения, гармоничных отношений и совместного духовного развития.');
  
  const [avatar, setAvatar] = useState(initialProfile?.avatar || SAMPLE_AVATARS[1]);
  const [photos, setPhotos] = useState<string[]>(initialProfile?.photos || [SAMPLE_AVATARS[1]]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  const [selectedGoals, setSelectedGoals] = useState<DatingGoalType[]>(
    initialProfile?.goals || ['love', 'spiritual', 'friends']
  );

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initialProfile?.interests || ['Медитация', 'Самопознание', 'Путешествия', 'IT & Технологии', 'Музыка']
  );
  const [customInterest, setCustomInterest] = useState('');

  const [achievements, setAchievements] = useState<string[]>(
    initialProfile?.achievements || ['Основал свой проект', 'Регулярно практикую осознанность']
  );
  const [newAchievement, setNewAchievement] = useState('');

  const [lifeGoals, setLifeGoals] = useState<string[]>(
    initialProfile?.lifeGoals || ['Создать крепкую семью на основе взаимного уважения', 'Путешествовать по местам силы']
  );
  const [newLifeGoal, setNewLifeGoal] = useState('');

  const [consciousnessLevel, setConsciousnessLevel] = useState<number>(
    initialProfile?.consciousnessLevel || 7
  );
  const [zodiacSign, setZodiacSign] = useState(initialProfile?.zodiacSign || 'Овен');
  const [spiritualTradition, setSpiritualTradition] = useState(
    initialProfile?.spiritualTradition || 'Даосизм & Гуманизм'
  );

  if (!isOpen) return null;

  const toggleGoal = (goalId: DatingGoalType) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) ? prev.filter(g => g !== goalId) : [...prev, goalId]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleAddCustomInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInterest.trim()) return;
    if (!selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests([...selectedInterests, customInterest.trim()]);
    }
    setCustomInterest('');
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    setPhotos([...photos, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleAddAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchievement.trim()) return;
    setAchievements([...achievements, newAchievement.trim()]);
    setNewAchievement('');
  };

  const handleRemoveAchievement = (idx: number) => {
    setAchievements(achievements.filter((_, i) => i !== idx));
  };

  const handleAddLifeGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLifeGoal.trim()) return;
    setLifeGoals([...lifeGoals, newLifeGoal.trim()]);
    setNewLifeGoal('');
  };

  const handleRemoveLifeGoal = (idx: number) => {
    setLifeGoals(lifeGoals.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: DatingProfile = {
      id: initialProfile?.id || `my-profile-${Date.now()}`,
      name: name.trim(),
      age: Number(age) || 25,
      gender,
      city: city.trim() || 'Москва',
      avatar: avatar || photos[0] || SAMPLE_AVATARS[0],
      photos: photos.length > 0 ? photos : [avatar || SAMPLE_AVATARS[0]],
      goals: selectedGoals.length > 0 ? selectedGoals : ['love'],
      bio: bio.trim(),
      occupation: occupation.trim(),
      interests: selectedInterests,
      achievements,
      lifeGoals,
      consciousnessLevel: Number(consciousnessLevel) || 7,
      consciousnessTitle: `Класс ${consciousnessLevel} • Осознанный Творец`,
      zodiacSign,
      spiritualTradition: spiritualTradition.trim(),
      verified: true,
      online: true,
      compatibilityScore: 95
    };

    onSave(updatedProfile);
    onClose();
  };

  return (
    <div className="dating-modal-backdrop" onClick={onClose}>
      <div className="edit-dating-card" onClick={e => e.stopPropagation()}>
        <div className="edit-dating-header">
          <div>
            <h3 className="edit-dating-title">Анкета знакомств & Резонанса</h3>
            <p className="edit-dating-subtitle">
              Заполните анкету, чтобы односознавцы, друзья и потенциальные партнеры могли найти вас.
            </p>
          </div>
          <button className="dating-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-dating-form">
          {/* 1. Основные данные (ФИО, Возраст, Пол, Город) */}
          <div className="form-fieldset">
            <h4 className="fieldset-title">
              <User size={16} />
              <span>1. Основные данные</span>
            </h4>
            
            <div className="form-grid-2">
              <div className="input-group">
                <label>Имя / ФИО *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  placeholder="Иван Петров"
                  className="dating-input"
                />
              </div>

              <div className="input-group">
                <label>Возраст (лет) *</label>
                <input 
                  type="number" 
                  min="18" 
                  max="99" 
                  value={age} 
                  onChange={e => setAge(Number(e.target.value))} 
                  required 
                  className="dating-input"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="input-group">
                <label>Пол</label>
                <select 
                  value={gender} 
                  onChange={e => setGender(e.target.value as any)}
                  className="dating-input"
                >
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                  <option value="other">Другой / Свой путь</option>
                </select>
              </div>

              <div className="input-group">
                <label>Город проживания *</label>
                <input 
                  type="text" 
                  value={city} 
                  onChange={e => setCity(e.target.value)} 
                  required 
                  placeholder="Москва, Сочи, Алматы..."
                  className="dating-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Род деятельности / Профессия</label>
              <input 
                type="text" 
                value={occupation} 
                onChange={e => setOccupation(e.target.value)} 
                placeholder="Архитектор, Психолог, Предприниматель..."
                className="dating-input"
              />
            </div>

            <div className="input-group">
              <label>О себе (в нескольких предложениях)</label>
              <textarea 
                rows={3}
                value={bio} 
                onChange={e => setBio(e.target.value)} 
                placeholder="Расскажите о своем взгляде на мир, ценностях и том, что для вас важно..."
                className="dating-textarea"
              />
            </div>
          </div>

          {/* 2. Для каких целей анкета */}
          <div className="form-fieldset">
            <h4 className="fieldset-title">
              <Target size={16} />
              <span>2. Для каких целей создаётся анкета *</span>
            </h4>
            <p className="fieldset-desc">Выберите один или несколько ориентиров:</p>

            <div className="goals-selector-grid">
              {DATING_GOALS.map(goal => {
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    className={`goal-toggle-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleGoal(goal.id)}
                  >
                    <span className="goal-toggle-icon">{goal.icon}</span>
                    <div className="goal-toggle-texts">
                      <span className="goal-toggle-label">{goal.label}</span>
                      <span className="goal-toggle-desc">{goal.description}</span>
                    </div>
                    {isSelected && <Check size={16} className="goal-check-pip" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Фотогалерея анкеты */}
          <div className="form-fieldset">
            <h4 className="fieldset-title">
              <Camera size={16} />
              <span>3. Фотографии анкеты</span>
            </h4>
            <p className="fieldset-desc">Добавьте до 5 фотографий (URL изображения):</p>

            <div className="photos-preview-strip">
              {photos.map((url, idx) => (
                <div key={idx} className="photo-thumb-box">
                  <img src={url} alt="" className="photo-thumb-img" />
                  <button 
                    type="button" 
                    className="photo-delete-btn"
                    onClick={() => handleRemovePhoto(idx)}
                    title="Удалить фото"
                  >
                    <Trash2 size={12} />
                  </button>
                  {idx === 0 && <span className="main-photo-badge">Главное</span>}
                </div>
              ))}
            </div>

            <div className="add-photo-input-line">
              <input 
                type="url" 
                value={newPhotoUrl}
                onChange={e => setNewPhotoUrl(e.target.value)}
                placeholder="Вставьте ссылку на фото (https://...)"
                className="dating-input"
              />
              <button 
                type="button" 
                className="btn-add-photo"
                onClick={handleAddPhoto}
              >
                <Plus size={15} />
                <span>Добавить фото</span>
              </button>
            </div>

            {/* Quick Pick Avatars */}
            <div className="sample-avatars-pick">
              <span className="pick-label">Или выберите готовое фото:</span>
              <div className="pick-avatars-list">
                {SAMPLE_AVATARS.map((url, idx) => (
                  <img 
                    key={idx}
                    src={url}
                    alt=""
                    className="sample-avatar-item"
                    onClick={() => {
                      if (!photos.includes(url)) {
                        setPhotos([...photos, url]);
                      }
                      setAvatar(url);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 4. Жизненные цели и достижения */}
          <div className="form-fieldset">
            <h4 className="fieldset-title">
              <Award size={16} />
              <span>4. Жизненные цели и достижения</span>
            </h4>

            {/* Достижения */}
            <div className="custom-items-group">
              <label className="sub-field-label">Ваши достижения в жизни:</label>
              <ul className="items-editable-list">
                {achievements.map((ach, idx) => (
                  <li key={idx}>
                    <span>⭐ {ach}</span>
                    <button type="button" onClick={() => handleRemoveAchievement(idx)}>
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="add-item-row">
                <input 
                  type="text" 
                  value={newAchievement}
                  onChange={e => setNewAchievement(e.target.value)}
                  placeholder="Например: Открыл студию, пробежал марафон..."
                  className="dating-input"
                />
                <button type="button" className="btn-add-item" onClick={handleAddAchievement}>
                  Добавить
                </button>
              </div>
            </div>

            {/* Цели */}
            <div className="custom-items-group">
              <label className="sub-field-label">Ваши цели на будущее:</label>
              <ul className="items-editable-list">
                {lifeGoals.map((g, idx) => (
                  <li key={idx}>
                    <span>🎯 {g}</span>
                    <button type="button" onClick={() => handleRemoveLifeGoal(idx)}>
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="add-item-row">
                <input 
                  type="text" 
                  value={newLifeGoal}
                  onChange={e => setNewLifeGoal(e.target.value)}
                  placeholder="Например: Построить дом у моря, создать семью..."
                  className="dating-input"
                />
                <button type="button" className="btn-add-item" onClick={handleAddLifeGoal}>
                  Добавить
                </button>
              </div>
            </div>
          </div>

          {/* 5. Увлечения и интересы */}
          <div className="form-fieldset">
            <h4 className="fieldset-title">
              <Sparkles size={16} />
              <span>5. Увлечения и хобби</span>
            </h4>
            <div className="interests-selection-wrap">
              {POPULAR_INTERESTS_TAGS.map(tag => {
                const isSelected = selectedInterests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-selectable-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleInterest(tag)}
                  >
                    {isSelected ? `✓ #${tag}` : `#${tag}`}
                  </button>
                );
              })}
            </div>

            <div className="add-item-row" style={{ marginTop: '0.8rem' }}>
              <input 
                type="text" 
                value={customInterest}
                onChange={e => setCustomInterest(e.target.value)}
                placeholder="Добавить свой интерес..."
                className="dating-input"
              />
              <button type="button" className="btn-add-item" onClick={handleAddCustomInterest}>
                + Тег
              </button>
            </div>
          </div>

          {/* 6. Духовный профиль & Сознание */}
          <div className="form-fieldset">
            <h4 className="fieldset-title">
              <Compass size={16} />
              <span>6. Духовный резонанс & Сознание</span>
            </h4>
            
            <div className="form-grid-3">
              <div className="input-group">
                <label>Класс сознания (1-11)</label>
                <select 
                  value={consciousnessLevel} 
                  onChange={e => setConsciousnessLevel(Number(e.target.value))}
                  className="dating-input"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11].map(lvl => (
                    <option key={lvl} value={lvl}>Класс {lvl}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Знак зодиака</label>
                <select 
                  value={zodiacSign} 
                  onChange={e => setZodiacSign(e.target.value)}
                  className="dating-input"
                >
                  {['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'].map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Мировоззрение</label>
                <input 
                  type="text" 
                  value={spiritualTradition} 
                  onChange={e => setSpiritualTradition(e.target.value)}
                  placeholder="Даосизм, Буддизм, Гуманизм..."
                  className="dating-input"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="edit-dating-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-save-dating">
              <Check size={16} />
              <span>Сохранить анкету</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
