import React, { useState, useMemo } from 'react';
import { 
  Heart, Sparkles, Search, MapPin, 
  MessageCircle, ShieldCheck, Edit3, 
  ChevronRight, ArrowRight, Users,
  Check, RotateCcw, Filter, SlidersHorizontal, X
} from 'lucide-react';
import { 
  INITIAL_DATING_PROFILES, 
  DATING_GOALS, 
  type DatingProfile, 
  type DatingGoalType 
} from '../data/datingData';
import { DatingProfileModal } from '../components/DatingProfileModal';
import { EditDatingProfileModal } from '../components/EditDatingProfileModal';
import { useAuth } from '../context/AuthContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './DatingPage.css';

type DatingViewMode = 'feed' | 'grid' | 'matches' | 'my_profile';

export const DatingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Mode: Лента свайпов, Каталог анкет, Мэтчи/лайки, Моя анкета
  const [viewMode, setViewMode] = useState<DatingViewMode>('feed');

  // Профили
  const [profiles, setProfiles] = useState<DatingProfile[]>(() => {
    const saved = localStorage.getItem('newage_dating_all_profiles');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_DATING_PROFILES;
  });

  // Моя анкета
  const [myProfile, setMyProfile] = useState<DatingProfile | null>(() => {
    const saved = localStorage.getItem('newage_dating_my_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return null;
  });

  // Лайки и взаимные симпатии
  const [likedIds, setLikedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('newage_dating_likes');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return ['dp-1'];
  });

  // Индекс активной карточки для свайп-ленты
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);

  // Фильтры
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [consciousnessFilter, setConsciousnessFilter] = useState<string>('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [minAgeFilter, setMinAgeFilter] = useState<number>(18);
  const [maxAgeFilter, setMaxAgeFilter] = useState<number>(80);

  // Подсчёт активных фильтров (кроме строки поиска)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedGoalFilter !== 'all') count++;
    if (genderFilter !== 'all') count++;
    if (selectedCity !== 'all') count++;
    if (consciousnessFilter !== 'all') count++;
    if (minAgeFilter > 18 || maxAgeFilter < 80) count++;
    return count;
  }, [selectedGoalFilter, genderFilter, selectedCity, consciousnessFilter, minAgeFilter, maxAgeFilter]);

  const handleResetFilters = () => {
    setSelectedGoalFilter('all');
    setGenderFilter('all');
    setSelectedCity('all');
    setConsciousnessFilter('all');
    setMinAgeFilter(18);
    setMaxAgeFilter(80);
    setSearchQuery('');
    setCurrentSwipeIndex(0);
  };

  // Модальные окна
  const [inspectedProfile, setInspectedProfile] = useState<DatingProfile | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Список уникальных городов
  const uniqueCities = useMemo(() => {
    const cities = new Set(profiles.map(p => p.city));
    return Array.from(cities);
  }, [profiles]);

  // Фильтрация анкет
  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      // Исключаем свою анкету из поиска
      if (myProfile && profile.id === myProfile.id) return false;

      // Фильтр по цели знакомства
      if (selectedGoalFilter !== 'all') {
        if (!profile.goals.includes(selectedGoalFilter as DatingGoalType)) return false;
      }

      // Фильтр по полу
      if (genderFilter !== 'all') {
        if (profile.gender !== genderFilter) return false;
      }

      // Фильтр по городу
      if (selectedCity !== 'all') {
        if (profile.city !== selectedCity) return false;
      }

      // Фильтр по классу сознания
      if (consciousnessFilter !== 'all') {
        if (profile.consciousnessLevel !== Number(consciousnessFilter)) return false;
      }

      // Фильтр по возрасту
      if (profile.age < minAgeFilter || profile.age > maxAgeFilter) {
        return false;
      }

      // Поисковый запрос по имени, городу, увлечениям
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = profile.name.toLowerCase().includes(q);
        const matchCity = profile.city.toLowerCase().includes(q);
        const matchBio = profile.bio.toLowerCase().includes(q);
        const matchInterests = profile.interests.some(i => i.toLowerCase().includes(q));
        if (!matchName && !matchCity && !matchBio && !matchInterests) return false;
      }

      return true;
    });
  }, [profiles, myProfile, selectedGoalFilter, genderFilter, selectedCity, consciousnessFilter, minAgeFilter, maxAgeFilter, searchQuery]);

  // Карточки для ленты свайпа
  const activeSwipeCard = filteredProfiles[currentSwipeIndex] || null;

  const handleLike = (profileId: string) => {
    setLikedIds(prev => {
      const updated = prev.includes(profileId) 
        ? prev.filter(id => id !== profileId) 
        : [...prev, profileId];
      localStorage.setItem('newage_dating_likes', JSON.stringify(updated));
      return updated;
    });

    // Переход к следующей карточке в режиме свайпа
    if (viewMode === 'feed') {
      setCurrentSwipeIndex(prev => (prev + 1 < filteredProfiles.length ? prev + 1 : 0));
    }
  };

  const handlePass = () => {
    setCurrentSwipeIndex(prev => (prev + 1 < filteredProfiles.length ? prev + 1 : 0));
  };

  const handleSaveMyProfile = (savedProfile: DatingProfile) => {
    setMyProfile(savedProfile);
    localStorage.setItem('newage_dating_my_profile', JSON.stringify(savedProfile));

    // Обновляем общий пул анкет
    setProfiles(prev => {
      const exists = prev.some(p => p.id === savedProfile.id);
      const updated = exists 
        ? prev.map(p => p.id === savedProfile.id ? savedProfile : p)
        : [savedProfile, ...prev];
      localStorage.setItem('newage_dating_all_profiles', JSON.stringify(updated));
      return updated;
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="dating-page-container">
        <GuestLockPrompt
          featureName="New Age Знакомства & Резонанс"
          title="Модуль знакомств доступен после авторизации"
          description="Создайте анкету, находите любовь, близких друзей, односознавцев и единомышленников по духовным практикам и общим жизненным целям."
          actionText="Войти или зарегистрироваться"
        />
      </div>
    );
  }

  return (
    <div className="dating-page-container">
      {/* Top Hero Banner */}
      <div className="dating-hero-banner">
        <div className="dating-hero-glow" />
        <div className="dating-hero-content">
          <div className="dating-hero-badge">
            <Sparkles size={14} />
            <span>Новый Модуль • Духовный Резонанс & Знакомства</span>
          </div>
          <h1 className="dating-hero-title">New Age Знакомства</h1>
          <p className="dating-hero-desc">
            Найдите вторую половинку для создания семьи, верных друзей по интересам или односознавцев и однодуховцев для совместного пути и практик.
          </p>

          <div className="dating-hero-actions">
            <button 
              className="btn-create-my-profile"
              onClick={() => setIsEditProfileOpen(true)}
            >
              <Edit3 size={16} />
              <span>{myProfile ? 'Редактировать мою анкету' : 'Создать свою анкету'}</span>
            </button>
            {myProfile && (
              <span className="my-profile-status-pill">
                <Check size={14} />
                <span>Анкета активна ({myProfile.name})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main View Mode Tabs (Лента / Сетка / Мэтчи / Моя анкета) */}
      <div className="dating-nav-bar">
        <div className="dating-modes-group">
          <button 
            className={`dating-mode-btn ${viewMode === 'feed' ? 'active' : ''}`}
            onClick={() => setViewMode('feed')}
          >
            <Sparkles size={16} />
            <span>Лента знакомств</span>
          </button>

          <button 
            className={`dating-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Users size={16} />
            <span>Каталог анкет ({filteredProfiles.length})</span>
          </button>

          <button 
            className={`dating-mode-btn ${viewMode === 'matches' ? 'active' : ''}`}
            onClick={() => setViewMode('matches')}
          >
            <Heart size={16} />
            <span>Симпатии ({likedIds.length})</span>
          </button>

          {myProfile && (
            <button 
              className={`dating-mode-btn ${viewMode === 'my_profile' ? 'active' : ''}`}
              onClick={() => setViewMode('my_profile')}
            >
              <span>Моя анкета</span>
            </button>
          )}
        </div>
      </div>

      {/* Goal Filter Pills (Любовь, Друзья, Односознавцы, Семья, Творчество...) & Filter Button */}
      <div className="dating-goals-filter-bar-wrap">
        <div className="dating-goals-filter-bar">
          <button 
            className={`goal-filter-pill ${selectedGoalFilter === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSelectedGoalFilter('all');
              setCurrentSwipeIndex(0);
            }}
          >
            <span>✨ Все цели</span>
          </button>
          {DATING_GOALS.map(goal => (
            <button 
              key={goal.id}
              className={`goal-filter-pill ${selectedGoalFilter === goal.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedGoalFilter(goal.id);
                setCurrentSwipeIndex(0);
              }}
            >
              <span>{goal.icon} {goal.label}</span>
            </button>
          ))}
        </div>

        {/* Prominent Filter Toggle Button */}
        <button 
          className={`btn-toggle-filters ${isFiltersOpen || activeFiltersCount > 0 ? 'active' : ''}`}
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          title="Открыть расширенные фильтры"
        >
          <SlidersHorizontal size={16} />
          <span>Фильтры</span>
          {activeFiltersCount > 0 && (
            <span className="filter-count-badge">{activeFiltersCount}</span>
          )}
        </button>
      </div>

      {/* Collapsible / Expandable Advanced Filter Panel */}
      {isFiltersOpen && (
        <div className="dating-expanded-filter-panel">
          <div className="filter-panel-header">
            <div className="filter-panel-title">
              <Filter size={16} />
              <span>Параметры поиска и фильтрации</span>
            </div>
            {activeFiltersCount > 0 && (
              <button 
                className="btn-reset-filters"
                onClick={handleResetFilters}
              >
                <RotateCcw size={14} />
                <span>Сбросить ({activeFiltersCount})</span>
              </button>
            )}
          </div>

          <div className="filter-panel-grid">
            {/* Пол */}
            <div className="filter-field-group">
              <label className="filter-label">Кого вы ищете:</label>
              <div className="filter-segmented-control">
                <button 
                  className={`segmented-btn ${genderFilter === 'all' ? 'active' : ''}`}
                  onClick={() => { setGenderFilter('all'); setCurrentSwipeIndex(0); }}
                >
                  Всех
                </button>
                <button 
                  className={`segmented-btn ${genderFilter === 'female' ? 'active' : ''}`}
                  onClick={() => { setGenderFilter('female'); setCurrentSwipeIndex(0); }}
                >
                  Девушек
                </button>
                <button 
                  className={`segmented-btn ${genderFilter === 'male' ? 'active' : ''}`}
                  onClick={() => { setGenderFilter('male'); setCurrentSwipeIndex(0); }}
                >
                  Парней
                </button>
              </div>
            </div>

            {/* Возраст */}
            <div className="filter-field-group">
              <label className="filter-label">Возраст: от {minAgeFilter} до {maxAgeFilter} лет</label>
              <div className="filter-age-inputs">
                <input 
                  type="range" 
                  min="18" 
                  max="65" 
                  value={minAgeFilter} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (val <= maxAgeFilter) setMinAgeFilter(val);
                    setCurrentSwipeIndex(0);
                  }}
                  className="filter-range-slider"
                  title="Минимальный возраст"
                />
                <input 
                  type="range" 
                  min="20" 
                  max="80" 
                  value={maxAgeFilter} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (val >= minAgeFilter) setMaxAgeFilter(val);
                    setCurrentSwipeIndex(0);
                  }}
                  className="filter-range-slider"
                  title="Максимальный возраст"
                />
              </div>
            </div>

            {/* Город */}
            <div className="filter-field-group">
              <label className="filter-label">Локация / Город:</label>
              <select 
                value={selectedCity} 
                onChange={e => {
                  setSelectedCity(e.target.value);
                  setCurrentSwipeIndex(0);
                }}
                className="filter-panel-select"
              >
                <option value="all">🌍 Все города и страны</option>
                {uniqueCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Класс сознания */}
            <div className="filter-field-group">
              <label className="filter-label">Класс сознания (1–11):</label>
              <select 
                value={consciousnessFilter} 
                onChange={e => {
                  setConsciousnessFilter(e.target.value);
                  setCurrentSwipeIndex(0);
                }}
                className="filter-panel-select"
              >
                <option value="all">✨ Любой класс сознания</option>
                {[1,2,3,4,5,6,7,8,9,10,11].map(lvl => (
                  <option key={lvl} value={String(lvl)}>Класс {lvl} {lvl >= 7 ? '★ Высоковибрационный' : ''}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Search and Quick Dropdowns */}
      <div className="dating-filters-bar">
        <div className="dating-search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentSwipeIndex(0);
            }}
            placeholder="Поиск по имени, городу, увлечениям..."
            className="dating-search-input"
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-selects-row">
          <button 
            className={`quick-filter-toggle-btn ${isFiltersOpen ? 'open' : ''}`}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter size={15} />
            <span>{isFiltersOpen ? 'Скрыть параметры' : 'Параметры фильтра'}</span>
            {activeFiltersCount > 0 && (
              <span className="quick-filter-badge">{activeFiltersCount}</span>
            )}
          </button>

          <select 
            value={genderFilter} 
            onChange={e => {
              setGenderFilter(e.target.value as any);
              setCurrentSwipeIndex(0);
            }}
            className="filter-dropdown"
          >
            <option value="all">Любой пол</option>
            <option value="female">Девушки</option>
            <option value="male">Парни</option>
          </select>

          <select 
            value={selectedCity} 
            onChange={e => {
              setSelectedCity(e.target.value);
              setCurrentSwipeIndex(0);
            }}
            className="filter-dropdown"
          >
            <option value="all">Все города</option>
            {uniqueCities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: SWIPE FEED (ЛЕНТА ОДНОЙ КАРТОЧКИ) */}
      {/* ========================================================================= */}
      {viewMode === 'feed' && (
        <div className="dating-feed-wrap">
          {activeSwipeCard ? (
            <div className="dating-swipe-card-container">
              <div 
                className="dating-swipe-card"
                onClick={() => setInspectedProfile(activeSwipeCard)}
              >
                <div className="swipe-card-image-wrap">
                  <img 
                    src={activeSwipeCard.photos[0] || activeSwipeCard.avatar} 
                    alt={activeSwipeCard.name} 
                    className="swipe-card-img" 
                  />
                  <div className="swipe-card-gradient" />

                  {/* Top badges */}
                  <div className="swipe-top-badges">
                    <span className="compat-chip">
                      <Sparkles size={14} />
                      <span>{activeSwipeCard.compatibilityScore}% Резонанс</span>
                    </span>
                    <span className="class-chip">
                      <span>Класс {activeSwipeCard.consciousnessLevel}</span>
                    </span>
                  </div>

                  {/* Bottom details overlay */}
                  <div className="swipe-bottom-info">
                    <div className="swipe-title-row">
                      <h2 className="swipe-name">{activeSwipeCard.name}, {activeSwipeCard.age}</h2>
                      {activeSwipeCard.verified && <ShieldCheck size={20} color="#38bdf8" />}
                    </div>

                    <div className="swipe-location-line">
                      <MapPin size={14} />
                      <span>{activeSwipeCard.city}</span>
                      <span>•</span>
                      <span>⭐ {activeSwipeCard.zodiacSign}</span>
                      {activeSwipeCard.occupation && (
                        <>
                          <span>•</span>
                          <span>{activeSwipeCard.occupation}</span>
                        </>
                      )}
                    </div>

                    {/* Goals chips */}
                    <div className="swipe-goals-row">
                      {activeSwipeCard.goals.map(gId => {
                        const g = DATING_GOALS.find(x => x.id === gId);
                        if (!g) return null;
                        return (
                          <span key={gId} className={`swipe-goal-tag ${g.badgeClass}`}>
                            {g.icon} {g.shortLabel}
                          </span>
                        );
                      })}
                    </div>

                    <p className="swipe-bio-snippet">{activeSwipeCard.bio}</p>

                    {/* Interests preview */}
                    <div className="swipe-interests-row">
                      {activeSwipeCard.interests.slice(0, 4).map((tag, i) => (
                        <span key={i} className="swipe-interest-pill">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Swipe Action Controls (Pass, Like, Inspect) */}
              <div className="swipe-controls-bar">
                <button 
                  type="button" 
                  className="swipe-btn pass" 
                  onClick={handlePass}
                  title="Пропустить анкету"
                >
                  <RotateCcw size={22} />
                  <span>Пропустить</span>
                </button>

                <button 
                  type="button" 
                  className="swipe-btn inspect" 
                  onClick={() => setInspectedProfile(activeSwipeCard)}
                  title="Открыть полную анкету"
                >
                  <ChevronRight size={22} />
                  <span>Подробнее</span>
                </button>

                <button 
                  type="button" 
                  className={`swipe-btn like ${likedIds.includes(activeSwipeCard.id) ? 'active' : ''}`}
                  onClick={() => handleLike(activeSwipeCard.id)}
                  title="Поставить лайк"
                >
                  <Heart size={24} className={likedIds.includes(activeSwipeCard.id) ? 'fill-current' : ''} />
                  <span>{likedIds.includes(activeSwipeCard.id) ? 'Понравилось' : 'Лайк'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="dating-empty-card">
              <Sparkles size={36} color="#F59E0B" />
              <h3>Анкеты по вашим фильтрам закончились</h3>
              <p>Попробуйте сбросить фильтры или выбрать другой город/цель знакомства.</p>
              <button 
                className="btn-reset-filters"
                onClick={() => {
                  setSelectedGoalFilter('all');
                  setGenderFilter('all');
                  setSelectedCity('all');
                  setConsciousnessFilter('all');
                  setSearchQuery('');
                  setCurrentSwipeIndex(0);
                }}
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: GRID CATALOG (СЕТКА ВСЕХ АНКЕТ) */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="dating-grid-container">
          {filteredProfiles.length === 0 ? (
            <div className="dating-empty-card">
              <h3>Ничего не найдено</h3>
              <p>Попробуйте изменить параметры поиска или фильтры.</p>
            </div>
          ) : (
            <div className="dating-profiles-grid">
              {filteredProfiles.map(profile => {
                const isLiked = likedIds.includes(profile.id);
                return (
                  <div 
                    key={profile.id} 
                    className="dating-card-item"
                    onClick={() => setInspectedProfile(profile)}
                  >
                    <div className="dating-card-img-wrap">
                      <img src={profile.avatar} alt={profile.name} className="dating-card-img" />
                      <div className="card-top-badges">
                        <span className="card-compat-pill">
                          <Sparkles size={11} />
                          <span>{profile.compatibilityScore}%</span>
                        </span>
                        <span className="card-class-pill">Класс {profile.consciousnessLevel}</span>
                      </div>
                      <div className="card-bottom-bar">
                        <span className="card-name">{profile.name}, {profile.age}</span>
                        <span className="card-city"><MapPin size={12} /> {profile.city}</span>
                      </div>
                    </div>

                    <div className="dating-card-content">
                      <div className="card-goals-row">
                        {profile.goals.slice(0, 2).map(gId => {
                          const g = DATING_GOALS.find(x => x.id === gId);
                          return g ? (
                            <span key={gId} className={`card-goal-chip ${g.badgeClass}`}>
                              {g.icon} {g.shortLabel}
                            </span>
                          ) : null;
                        })}
                      </div>
                      <p className="card-bio-snip">{profile.bio}</p>

                      <div className="card-actions-row">
                        <button 
                          type="button" 
                          className={`card-like-btn ${isLiked ? 'liked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(profile.id);
                          }}
                        >
                          <Heart size={16} className={isLiked ? 'fill-current' : ''} />
                          <span>{isLiked ? 'Нравится' : 'Лайк'}</span>
                        </button>

                        <button 
                          type="button" 
                          className="card-details-btn"
                          onClick={() => setInspectedProfile(profile)}
                        >
                          <span>Анкета</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: MATCHES & LIKES */}
      {/* ========================================================================= */}
      {viewMode === 'matches' && (
        <div className="dating-matches-container">
          <div className="matches-header">
            <h3>Анкеты, которым вы выразили симпатию</h3>
            <p>Вы можете сразу перейти в чат мессенджера или просмотреть анкету подробнее.</p>
          </div>

          {likedIds.length === 0 ? (
            <div className="dating-empty-card">
              <Heart size={36} color="#EC4899" />
              <h3>У вас пока нет сохраненных симпатий</h3>
              <p>Перейдите в ленту знакомств и ставьте лайки тем, кто вам откликается!</p>
              <button className="btn-reset-filters" onClick={() => setViewMode('feed')}>
                Перейти в ленту
              </button>
            </div>
          ) : (
            <div className="dating-profiles-grid">
              {profiles.filter(p => likedIds.includes(p.id)).map(profile => (
                <div 
                  key={profile.id} 
                  className="dating-card-item"
                  onClick={() => setInspectedProfile(profile)}
                >
                  <div className="dating-card-img-wrap">
                    <img src={profile.avatar} alt={profile.name} className="dating-card-img" />
                    <div className="card-top-badges">
                      <span className="card-compat-pill" style={{ background: '#ec4899' }}>
                        <Heart size={12} className="fill-current" />
                        <span>Симпатия</span>
                      </span>
                      <span className="card-class-pill">Класс {profile.consciousnessLevel}</span>
                    </div>
                    <div className="card-bottom-bar">
                      <span className="card-name">{profile.name}, {profile.age}</span>
                      <span className="card-city"><MapPin size={12} /> {profile.city}</span>
                    </div>
                  </div>

                  <div className="dating-card-content">
                    <p className="card-bio-snip">{profile.bio}</p>
                    <div className="card-actions-row">
                      <button 
                        type="button" 
                        className="card-like-btn liked"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(profile.id);
                        }}
                      >
                        <Heart size={16} className="fill-current" />
                        <span>Убрать лайк</span>
                      </button>

                      <button 
                        type="button" 
                        className="card-details-btn"
                        onClick={() => setInspectedProfile(profile)}
                      >
                        <span>Написать</span>
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 4: MY PROFILE PREVIEW */}
      {/* ========================================================================= */}
      {viewMode === 'my_profile' && myProfile && (
        <div className="my-profile-preview-wrap">
          <div className="my-profile-control-bar">
            <h3>Ваша активная анкета знакомств</h3>
            <button 
              className="btn-edit-active-profile"
              onClick={() => setIsEditProfileOpen(true)}
            >
              <Edit3 size={16} />
              <span>Редактировать анкету</span>
            </button>
          </div>

          <div className="my-profile-card">
            <div className="my-profile-gallery-row">
              {myProfile.photos.map((url, i) => (
                <img key={i} src={url} alt="" className="my-profile-photo" />
              ))}
            </div>

            <div className="my-profile-details">
              <h2 className="my-profile-name">{myProfile.name}, {myProfile.age}</h2>
              <div className="my-profile-meta-line">
                <span><MapPin size={14} /> {myProfile.city}</span>
                <span>•</span>
                <span>⭐ {myProfile.zodiacSign}</span>
                <span>•</span>
                <span className="class-chip">Класс {myProfile.consciousnessLevel}</span>
              </div>

              <div className="my-profile-goals-list">
                {myProfile.goals.map(gId => {
                  const g = DATING_GOALS.find(x => x.id === gId);
                  return g ? (
                    <span key={gId} className={`swipe-goal-tag ${g.badgeClass}`}>
                      {g.icon} {g.label}
                    </span>
                  ) : null;
                })}
              </div>

              <p className="my-profile-bio">{myProfile.bio}</p>

              {myProfile.achievements?.length > 0 && (
                <div className="my-profile-extra-block">
                  <h4>Достижения:</h4>
                  <ul>
                    {myProfile.achievements.map((item, i) => (
                      <li key={i}>⭐ {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {myProfile.lifeGoals?.length > 0 && (
                <div className="my-profile-extra-block">
                  <h4>Цели на будущее:</h4>
                  <ul>
                    {myProfile.lifeGoals.map((item, i) => (
                      <li key={i}>🎯 {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Profile Modal */}
      <DatingProfileModal 
        profile={inspectedProfile}
        isOpen={!!inspectedProfile}
        onClose={() => setInspectedProfile(null)}
        onLike={handleLike}
        isLiked={inspectedProfile ? likedIds.includes(inspectedProfile.id) : false}
      />

      {/* Edit My Profile Modal */}
      <EditDatingProfileModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSave={handleSaveMyProfile}
        initialProfile={myProfile}
      />
    </div>
  );
};
