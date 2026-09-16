import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Sparkles, Search, MapPin, 
  MessageCircle, ShieldCheck, Edit3, 
  ChevronRight, ArrowRight, Users,
  Check, RotateCcw, Filter, X,
  Navigation, Globe
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

  const navigate = useNavigate();

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

  // Всплывающее окно взаимной симпатии (Мэтч!)
  const [mutualMatchProfile, setMutualMatchProfile] = useState<DatingProfile | null>(null);

  // Индекс активной карточки для свайп-ленты
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);

  // Фильтры
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Гео-фильтрация: по близости (радиус км) либо по городам и странам
  const [locationMode, setLocationMode] = useState<'any' | 'proximity' | 'city_country'>('any');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(50); // радиус поиска по близости (до 500 км)
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState('all');

  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [consciousnessFilter, setConsciousnessFilter] = useState<string>('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [minAgeFilter, setMinAgeFilter] = useState<number>(18);
  const [maxAgeFilter, setMaxAgeFilter] = useState<number>(80);

  // Список уникальных стран и городов
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>();
    profiles.forEach(p => {
      if (p.country) countries.add(p.country);
    });
    return Array.from(countries);
  }, [profiles]);

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    profiles.forEach(p => {
      if (selectedCountry === 'all' || p.country === selectedCountry) {
        cities.add(p.city);
      }
    });
    return Array.from(cities);
  }, [profiles, selectedCountry]);

  // Подсчёт активных фильтров (кроме строки поиска)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedGoalFilter !== 'all') count++;
    if (genderFilter !== 'all') count++;
    if (locationMode === 'proximity') count++;
    if (locationMode === 'city_country' && (selectedCountry !== 'all' || selectedCity !== 'all')) count++;
    if (selectedCity !== 'all' && locationMode !== 'city_country') count++;
    if (consciousnessFilter !== 'all') count++;
    if (minAgeFilter > 18 || maxAgeFilter < 80) count++;
    return count;
  }, [selectedGoalFilter, genderFilter, locationMode, selectedCountry, selectedCity, consciousnessFilter, minAgeFilter, maxAgeFilter]);

  const handleResetFilters = () => {
    setSelectedGoalFilter('all');
    setGenderFilter('all');
    setLocationMode('any');
    setSelectedCountry('all');
    setSelectedCity('all');
    setMaxDistanceKm(50);
    setConsciousnessFilter('all');
    setMinAgeFilter(18);
    setMaxAgeFilter(80);
    setSearchQuery('');
    setCurrentSwipeIndex(0);
  };

  // Модальные окна
  const [inspectedProfile, setInspectedProfile] = useState<DatingProfile | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

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

      // Гео-фильтрация:
      if (locationMode === 'proximity') {
        // Фильтр по близости: расстояние не должно превышать выбранный радиус
        const dist = profile.distanceKm ?? 25;
        if (dist > maxDistanceKm) return false;
      } else if (locationMode === 'city_country') {
        // Фильтр по стране
        if (selectedCountry !== 'all' && profile.country !== selectedCountry) {
          return false;
        }
        // Фильтр по городу
        if (selectedCity !== 'all' && profile.city !== selectedCity) {
          return false;
        }
      } else {
        // Режим 'any' — если выбран конкретный город в выпадающем списке
        if (selectedCity !== 'all' && profile.city !== selectedCity) {
          return false;
        }
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
        const matchCountry = (profile.country || '').toLowerCase().includes(q);
        const matchBio = profile.bio.toLowerCase().includes(q);
        const matchInterests = profile.interests.some(i => i.toLowerCase().includes(q));
        if (!matchName && !matchCity && !matchCountry && !matchBio && !matchInterests) return false;
      }

      return true;
    });
  }, [profiles, myProfile, selectedGoalFilter, genderFilter, locationMode, maxDistanceKm, selectedCountry, selectedCity, consciousnessFilter, minAgeFilter, maxAgeFilter, searchQuery]);

  // Карточки для ленты свайпа
  const activeSwipeCard = filteredProfiles[currentSwipeIndex] || null;

  // Обработка лайка и регистрация взаимной симпатии
  const handleLike = (profileId: string) => {
    const isAlreadyLiked = likedIds.includes(profileId);
    const targetProfile = profiles.find(p => p.id === profileId);

    setLikedIds(prev => {
      const updated = isAlreadyLiked 
        ? prev.filter(id => id !== profileId) 
        : [...prev, profileId];
      localStorage.setItem('newage_dating_likes', JSON.stringify(updated));
      return updated;
    });

    // Если поставили лайк (а не убрали), регистрируем взаимную симпатию и открываем окно мэтча
    if (!isAlreadyLiked && targetProfile) {
      // Имитируем ответную взаимную симпатию и создаем чат
      setMutualMatchProfile(targetProfile);
      createOrUpdateMatchChat(targetProfile);
    }

    // Переход к следующей карточке в режиме свайпа
    if (viewMode === 'feed') {
      setCurrentSwipeIndex(prev => (prev + 1 < filteredProfiles.length ? prev + 1 : 0));
    }
  };

  // Создание диалога в мессенджере при взаимной симпатии
  const createOrUpdateMatchChat = (profile: DatingProfile) => {
    const matchChatId = `chat_dating_${profile.id}`;
    const savedChatsStr = localStorage.getItem('newage_messenger_chats');
    let currentChats: any[] = [];
    if (savedChatsStr) {
      try { currentChats = JSON.parse(savedChatsStr); } catch { /* ignore */ }
    }

    const existingChat = currentChats.find(c => c.id === matchChatId);
    if (!existingChat) {
      const newChat = {
        id: matchChatId,
        user: {
          id: profile.id,
          name: profile.name,
          username: profile.username || profile.id,
          avatar: profile.avatar || (profile.photos && profile.photos[0]) || '',
          online: profile.online ?? true,
          verified: profile.verified ?? true,
          followersCount: 420,
          followingCount: 140,
          postsCount: 18,
          consciousnessLevel: profile.consciousnessLevel,
          consciousnessTitle: profile.consciousnessTitle,
          zodiacSign: profile.zodiacSign
        },
        lastMessage: `💖 Взаимная симпатия! Резонанс ${profile.compatibilityScore || 95}%`,
        time: 'Только что',
        unread: 1,
        isFavorite: true,
        tagId: 'dating_match',
        messages: [
          {
            id: `m_match_${Date.now()}_1`,
            text: `✨ Поздравляем! У вас взаимная симпатия с ${profile.name} (${profile.age} лет, ${profile.city}). Резонанс душ: ${profile.compatibilityScore || 95}%!`,
            fromMe: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read'
          },
          {
            id: `m_match_${Date.now()}_2`,
            text: `Привет! Твоя анкета очень отозвалась в моем сердце. Рада познакомиться и пообщаться поближе ✨`,
            fromMe: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent'
          }
        ]
      };
      const updated = [newChat, ...currentChats.filter(c => c.id !== matchChatId)];
      localStorage.setItem('newage_messenger_chats', JSON.stringify(updated));
    }
  };

  const handleOpenMessengerWithProfile = (profileId: string) => {
    navigate(`/messenger?datingProfile=${encodeURIComponent(profileId)}`);
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
            {/* Цель знакомства */}
            <div className="filter-field-group">
              <label className="filter-label">Цель знакомства:</label>
              <select 
                value={selectedGoalFilter} 
                onChange={e => {
                  setSelectedGoalFilter(e.target.value);
                  setCurrentSwipeIndex(0);
                }}
                className="filter-panel-select"
              >
                <option value="all">✨ Все цели</option>
                {DATING_GOALS.map(goal => (
                  <option key={goal.id} value={goal.id}>
                    {goal.icon} {goal.label}
                  </option>
                ))}
              </select>
            </div>

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

            {/* Локация: Переключатель режима поиска (По близости / По городам и странам) */}
            <div className="filter-field-group filter-field-group-wide">
              <label className="filter-label">Геолокация и охват:</label>
              <div className="filter-segmented-control">
                <button 
                  className={`segmented-btn ${locationMode === 'any' ? 'active' : ''}`}
                  onClick={() => { setLocationMode('any'); setCurrentSwipeIndex(0); }}
                >
                  <Globe size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Все регионы
                </button>
                <button 
                  className={`segmented-btn ${locationMode === 'proximity' ? 'active' : ''}`}
                  onClick={() => { setLocationMode('proximity'); setCurrentSwipeIndex(0); }}
                >
                  <Navigation size={13} style={{ display: 'inline', marginRight: 4 }} />
                  По близости (рядом)
                </button>
                <button 
                  className={`segmented-btn ${locationMode === 'city_country' ? 'active' : ''}`}
                  onClick={() => { setLocationMode('city_country'); setCurrentSwipeIndex(0); }}
                >
                  <MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />
                  По городам & странам
                </button>
              </div>
            </div>

            {/* Если выбран режим "По близости" */}
            {locationMode === 'proximity' && (
              <div className="filter-field-group">
                <label className="filter-label">
                  Радиус поиска: до <span style={{ color: '#8b5cf6', fontWeight: 800 }}>{maxDistanceKm} км</span>
                </label>
                <div className="filter-proximity-input-row">
                  <input 
                    type="range" 
                    min="5" 
                    max="500" 
                    step="5"
                    value={maxDistanceKm} 
                    onChange={e => {
                      setMaxDistanceKm(Number(e.target.value));
                      setCurrentSwipeIndex(0);
                    }}
                    className="filter-range-slider"
                  />
                  <div className="proximity-pills">
                    {[10, 25, 50, 100, 250].map(km => (
                      <button 
                        key={km}
                        type="button"
                        className={`proximity-quick-pill ${maxDistanceKm === km ? 'active' : ''}`}
                        onClick={() => {
                          setMaxDistanceKm(km);
                          setCurrentSwipeIndex(0);
                        }}
                      >
                        {km} км
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Если выбран режим "По городам и странам" */}
            {locationMode === 'city_country' && (
              <>
                <div className="filter-field-group">
                  <label className="filter-label">Страна:</label>
                  <select 
                    value={selectedCountry} 
                    onChange={e => {
                      setSelectedCountry(e.target.value);
                      setSelectedCity('all');
                      setCurrentSwipeIndex(0);
                    }}
                    className="filter-panel-select"
                  >
                    <option value="all">🌍 Любая страна</option>
                    {uniqueCountries.map(cnt => (
                      <option key={cnt} value={cnt}>{cnt}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-field-group">
                  <label className="filter-label">Город:</label>
                  <select 
                    value={selectedCity} 
                    onChange={e => {
                      setSelectedCity(e.target.value);
                      setCurrentSwipeIndex(0);
                    }}
                    className="filter-panel-select"
                  >
                    <option value="all">🏙️ Любой город</option>
                    {uniqueCities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Если режим 'any' - быстрый выбор города */}
            {locationMode === 'any' && (
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
            )}

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
                      {activeSwipeCard.distanceKm !== undefined && (
                        <>
                          <span>•</span>
                          <span className="card-distance-pill">
                            <Navigation size={12} /> {activeSwipeCard.distanceKm} км от вас
                          </span>
                        </>
                      )}
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
                        <div className="card-location-meta">
                          <span className="card-city"><MapPin size={12} /> {profile.city}</span>
                          {profile.distanceKm !== undefined && (
                            <span className="card-dist-tag"><Navigation size={10} /> {profile.distanceKm} км</span>
                          )}
                        </div>
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

      {/* Всплывающее окно взаимной симпатии (Mutual Match Modal) */}
      {mutualMatchProfile && (
        <div className="mutual-match-overlay" onClick={() => setMutualMatchProfile(null)}>
          <div className="mutual-match-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="mutual-match-close-btn" 
              onClick={() => setMutualMatchProfile(null)}
              title="Закрыть"
            >
              <X size={18} />
            </button>

            <div className="mutual-match-sparkle-icon">
              <Sparkles size={32} color="#ec4899" />
            </div>

            <h2 className="mutual-match-title">Взаимная симпатия!</h2>
            <p className="mutual-match-subtitle">
              Вы и <strong>{mutualMatchProfile.name}</strong> понравились друг другу. Резонанс душ: <span className="mutual-match-compat-pct">{mutualMatchProfile.compatibilityScore || 95}%</span>!
            </p>

            {/* Двойные аватарки / фото */}
            <div className="mutual-match-avatars-row">
              <div className="match-avatar-circle user">
                <img 
                  src={myProfile?.avatar || (myProfile?.photos && myProfile.photos[0]) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                  alt="Вы" 
                />
                <span className="match-avatar-label">Вы</span>
              </div>
              <div className="match-heart-center">
                <Heart size={28} className="fill-current" />
              </div>
              <div className="match-avatar-circle target">
                <img 
                  src={mutualMatchProfile.avatar || (mutualMatchProfile.photos && mutualMatchProfile.photos[0]) || ''} 
                  alt={mutualMatchProfile.name} 
                />
                <span className="match-avatar-label">{mutualMatchProfile.name}</span>
              </div>
            </div>

            <div className="mutual-match-info-box">
              <div className="match-location-text">
                <MapPin size={14} />
                <span>{mutualMatchProfile.city}{mutualMatchProfile.country ? `, ${mutualMatchProfile.country}` : ''}</span>
                {mutualMatchProfile.distanceKm !== undefined && (
                  <span className="match-distance-badge">
                    <Navigation size={11} /> {mutualMatchProfile.distanceKm} км от вас
                  </span>
                )}
              </div>
              <p className="match-bio-preview">«{mutualMatchProfile.bio}»</p>
            </div>

            <div className="mutual-match-actions">
              <button 
                type="button"
                className="btn-match-chat"
                onClick={() => {
                  const targetId = mutualMatchProfile.id;
                  setMutualMatchProfile(null);
                  handleOpenMessengerWithProfile(targetId);
                }}
              >
                <MessageCircle size={18} />
                <span>Написать в мессенджере</span>
              </button>

              <button 
                type="button"
                className="btn-match-continue"
                onClick={() => setMutualMatchProfile(null)}
              >
                Продолжить поиск
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
