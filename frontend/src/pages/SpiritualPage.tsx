import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Flower2, Activity, Sunrise, Wind, Waves, BookOpen, 
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, 
  CheckCircle2, Plus, Trash2, Heart, ChevronLeft, ChevronRight,
  GraduationCap, Megaphone, Star, Check, X
} from 'lucide-react';
import { 
  MEDITATION_TRACKS, YOGA_ROUTINES, INITIAL_AFFIRMATIONS, 
  BREATHING_TECHNIQUES, AMBIENT_SOUNDS, WISDOM_QUOTES,
  INITIAL_COURSES, CURRENCIES, convertPrice, formatPrice,
  type YogaRoutine, type Affirmation, type SpiritualCourse, type CurrencyCode
} from '../data/spiritualData';
import { spiritualAudio } from '../utils/spiritualAudio';
import { useAuth } from '../context/AuthContext';
import { GuestLockPrompt } from '../components/GuestLockPrompt';
import './SpiritualPage.css';

type TabType = 'meditation' | 'yoga' | 'affirmations' | 'breathing' | 'sounds' | 'wisdom' | 'courses';

export function SpiritualPage() {
  const { isAuthenticated } = useAuth();
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  // Active Tab
  const activeTab: TabType = (tab && ['meditation', 'yoga', 'affirmations', 'breathing', 'sounds', 'wisdom', 'courses'].includes(tab)) 
    ? (tab as TabType) 
    : 'meditation';

  const handleTabChange = (newTab: TabType) => {
    navigate(`/spiritual/${newTab}`);
  };

  // --- MULTI-CURRENCY STATE ---
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(() => {
    return (localStorage.getItem('newage_spiritual_currency') as CurrencyCode) || 'RUB';
  });

  const handleCurrencyChange = (curr: CurrencyCode) => {
    setSelectedCurrency(curr);
    localStorage.setItem('newage_spiritual_currency', curr);
  };

  // Calculate formatted price for any course
  const getCoursePrice = (course: SpiritualCourse) => {
    const rawPrice = convertPrice(course.basePrice, course.baseCurrency, selectedCurrency);
    if (course.discountPercent) {
      const discountedRaw = Math.round(rawPrice * (1 - course.discountPercent / 100));
      return {
        original: formatPrice(rawPrice, selectedCurrency),
        discounted: formatPrice(discountedRaw, selectedCurrency),
        hasDiscount: true,
        percent: course.discountPercent
      };
    }
    return {
      original: formatPrice(rawPrice, selectedCurrency),
      discounted: formatPrice(rawPrice, selectedCurrency),
      hasDiscount: false,
      percent: 0
    };
  };

  // --- COMMERCIAL COURSES & PROMO STATE ---
  const [coursesList, setCoursesList] = useState<SpiritualCourse[]>(() => {
    const saved = localStorage.getItem('newage_spiritual_courses');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_COURSES;
  });

  const [courseCategoryFilter, setCourseCategoryFilter] = useState<string>('all');
  const [selectedCourseForPurchase, setSelectedCourseForPurchase] = useState<SpiritualCourse | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);

  // New Course Form State
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseSubtitle, setNewCourseSubtitle] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState<SpiritualCourse['category']>('yoga');
  const [newCourseFormat, setNewCourseFormat] = useState<SpiritualCourse['format']>('Видеокурс');
  const [newCourseAuthorName, setNewCourseAuthorName] = useState('');
  const [newCourseAuthorRole, setNewCourseAuthorRole] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState('4 недели • 12 уроков');
  const [newCoursePrice, setNewCoursePrice] = useState('5000');
  const [newCourseCurrency, setNewCourseCurrency] = useState<CurrencyCode>('RUB');
  const [newCourseDiscount, setNewCourseDiscount] = useState('20');
  const [newCourseIsSponsored, setNewCourseIsSponsored] = useState(true);
  const [newCourseDescription, setNewCourseDescription] = useState('');

  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim() || !newCoursePrice) return;

    const newCourse: SpiritualCourse = {
      id: `course-${Date.now()}`,
      title: newCourseTitle.trim(),
      subtitle: newCourseSubtitle.trim() || 'Авторская практическая программа обучения',
      category: newCourseCategory,
      categoryLabel: 
        newCourseCategory === 'yoga' ? 'Йога и Прана' :
        newCourseCategory === 'meditation' ? 'Медитация' :
        newCourseCategory === 'affirmations' ? 'Аффирмации и Разум' :
        newCourseCategory === 'breathing' ? 'Дыхание' :
        newCourseCategory === 'soundhealing' ? 'Саундхилинг' : 'Живые Ретриты',
      authorName: newCourseAuthorName.trim() || 'Сертифицированный Мастер',
      authorRole: newCourseAuthorRole.trim() || 'Инструктор New Age Academy',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      authorVerified: true,
      rating: 5.0,
      studentsCount: 1,
      lessonsCount: 12,
      durationLabel: newCourseDuration,
      format: newCourseFormat,
      description: newCourseDescription.trim() || 'Комплексная программа самопознания и практик для трансформации тела и сознания.',
      highlights: [
        'Пошаговые видеоматериалы и подробные инструкции',
        'Персональная поддержка и закрытый чат участников',
        'Бессрочный доступ ко всем обновлениям программы'
      ],
      basePrice: Number(newCoursePrice) || 3000,
      baseCurrency: newCourseCurrency,
      discountPercent: Number(newCourseDiscount) || undefined,
      isSponsored: newCourseIsSponsored,
      sponsoredPlacement: newCourseIsSponsored ? [newCourseCategory, 'all'] : ['all'],
      badgeLabel: newCourseIsSponsored ? '🔥 СПОНСИРОВАНО • НОВИНКА' : '✨ НОВЫЙ КУРС',
      bgGradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)'
    };

    const updated = [newCourse, ...coursesList];
    setCoursesList(updated);
    localStorage.setItem('newage_spiritual_courses', JSON.stringify(updated));
    setIsCreateCourseModalOpen(false);
    spiritualAudio.playCrystalChime();

    // Reset form
    setNewCourseTitle('');
    setNewCourseSubtitle('');
    setNewCourseDescription('');
    setNewCoursePrice('5000');
  };

  const handleSimulatePurchase = () => {
    spiritualAudio.playCrystalChime();
    setPurchaseSuccess(true);
    setTimeout(() => {
      setPurchaseSuccess(false);
      setSelectedCourseForPurchase(null);
    }, 2500);
  };

  // --- MEDITATION TIMER STATE ---
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(10 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [meditationMinutesTotal, setMeditationMinutesTotal] = useState(() => {
    return parseInt(localStorage.getItem('newage_meditation_minutes') || '25', 10);
  });
  const [selectedBgSound, setSelectedBgSound] = useState<'none' | '432' | '528' | 'bowl' | 'rain' | 'waves'>('432');

  useEffect(() => {
    setTimerSecondsLeft(timerMinutes * 60);
    setIsTimerRunning(false);
  }, [timerMinutes]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            spiritualAudio.playZenBowl(384, 5);
            setMeditationMinutesTotal(m => {
              const updated = m + timerMinutes;
              localStorage.setItem('newage_meditation_minutes', updated.toString());
              return updated;
            });
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft, timerMinutes]);

  const handleToggleTimer = () => {
    if (!isTimerRunning) {
      spiritualAudio.playZenBowl(432, 4);
      if (selectedBgSound === '432') {
        spiritualAudio.toggleContinuousTone('timer-bg-432', 432, 0.15);
      } else if (selectedBgSound === '528') {
        spiritualAudio.toggleContinuousTone('timer-bg-528', 528, 0.15);
      } else if (selectedBgSound === 'bowl') {
        spiritualAudio.toggleContinuousTone('timer-bg-bowl', 216, 0.18);
      } else if (selectedBgSound === 'rain') {
        spiritualAudio.toggleNoise('timer-bg-rain', 'lowpass', 1200, 0.12);
      } else if (selectedBgSound === 'waves') {
        spiritualAudio.toggleNoise('timer-bg-waves', 'bandpass', 650, 0.14);
      }
      setIsTimerRunning(true);
    } else {
      spiritualAudio.stopContinuous('timer-bg-432');
      spiritualAudio.stopContinuous('timer-bg-528');
      spiritualAudio.stopContinuous('timer-bg-bowl');
      spiritualAudio.stopContinuous('timer-bg-rain');
      spiritualAudio.stopContinuous('timer-bg-waves');
      setIsTimerRunning(false);
    }
  };

  const handleResetTimer = () => {
    spiritualAudio.stopContinuous('timer-bg-432');
    spiritualAudio.stopContinuous('timer-bg-528');
    spiritualAudio.stopContinuous('timer-bg-bowl');
    spiritualAudio.stopContinuous('timer-bg-rain');
    spiritualAudio.stopContinuous('timer-bg-waves');
    setIsTimerRunning(false);
    setTimerSecondsLeft(timerMinutes * 60);
  };

  // --- YOGA INTERACTIVE PRACTICE ---
  const [activeRoutine, setActiveRoutine] = useState<YogaRoutine | null>(null);
  const [currentPoseIdx, setCurrentPoseIdx] = useState(0);
  const [poseSecondsLeft, setPoseSecondsLeft] = useState(30);
  const [isPoseRunning, setIsPoseRunning] = useState(false);

  const startRoutine = (routine: YogaRoutine) => {
    setActiveRoutine(routine);
    setCurrentPoseIdx(0);
    setPoseSecondsLeft(routine.poses[0]?.durationSec || 30);
    setIsPoseRunning(true);
    spiritualAudio.playZenBowl(528, 2.5);
  };

  const stopRoutine = () => {
    setActiveRoutine(null);
    setIsPoseRunning(false);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPoseRunning && activeRoutine) {
      interval = setInterval(() => {
        setPoseSecondsLeft(prev => {
          if (prev <= 1) {
            spiritualAudio.playZenBowl(432, 2);
            if (currentPoseIdx < activeRoutine.poses.length - 1) {
              const nextIdx = currentPoseIdx + 1;
              setCurrentPoseIdx(nextIdx);
              return activeRoutine.poses[nextIdx].durationSec;
            } else {
              setIsPoseRunning(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPoseRunning, activeRoutine, currentPoseIdx]);

  // --- AFFIRMATIONS STATE ---
  const [affirmationsList, setAffirmationsList] = useState<Affirmation[]>(() => {
    const saved = localStorage.getItem('newage_affirmations');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_AFFIRMATIONS;
  });

  const [affirmationCategory, setAffirmationCategory] = useState<string>('all');
  const [dailyAffirmation, setDailyAffirmation] = useState<Affirmation>(INITIAL_AFFIRMATIONS[0]);
  const [acceptedCount, setAcceptedCount] = useState(() => {
    return parseInt(localStorage.getItem('newage_accepted_affirmations') || '14', 10);
  });
  const [newAffText, setNewAffText] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);

  const getRandomAffirmation = () => {
    setIsFlipping(true);
    spiritualAudio.playCrystalChime();
    setTimeout(() => {
      const pool = affirmationCategory === 'all' 
        ? affirmationsList 
        : affirmationsList.filter(a => a.category === affirmationCategory);
      const filteredPool = pool.length > 0 ? pool : affirmationsList;
      const randomItem = filteredPool[Math.floor(Math.random() * filteredPool.length)];
      setDailyAffirmation(randomItem);
      setIsFlipping(false);
    }, 280);
  };

  const handleAcceptAffirmation = () => {
    spiritualAudio.playCrystalChime();
    setAcceptedCount(prev => {
      const next = prev + 1;
      localStorage.setItem('newage_accepted_affirmations', next.toString());
      return next;
    });
  };

  const handleAddAffirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAffText.trim()) return;
    const newAff: Affirmation = {
      id: `custom-${Date.now()}`,
      category: 'harmony',
      categoryLabel: 'Моя личная аффирмация',
      text: newAffText.trim()
    };
    const updated = [newAff, ...affirmationsList];
    setAffirmationsList(updated);
    localStorage.setItem('newage_affirmations', JSON.stringify(updated));
    setDailyAffirmation(newAff);
    setNewAffText('');
    spiritualAudio.playCrystalChime();
  };

  const handleDeleteAffirmation = (id: string) => {
    const updated = affirmationsList.filter(a => a.id !== id);
    setAffirmationsList(updated);
    localStorage.setItem('newage_affirmations', JSON.stringify(updated));
  };

  // --- BREATHING PRACTICE STATE ---
  const [selectedBreathTech, setSelectedBreathTech] = useState(BREATHING_TECHNIQUES[0]);
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdAfter'>('inhale');
  const [breathCountdown, setBreathCountdown] = useState(4);
  const [completedBreathCycles, setCompletedBreathCycles] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isBreathingRunning) {
      timer = setInterval(() => {
        setBreathCountdown(prev => {
          if (prev > 1) return prev - 1;

          if (breathPhase === 'inhale') {
            if (selectedBreathTech.holdSec > 0) {
              setBreathPhase('hold');
              return selectedBreathTech.holdSec;
            } else {
              setBreathPhase('exhale');
              return selectedBreathTech.exhaleSec;
            }
          } else if (breathPhase === 'hold') {
            setBreathPhase('exhale');
            return selectedBreathTech.exhaleSec;
          } else if (breathPhase === 'exhale') {
            if (selectedBreathTech.holdAfterExhaleSec > 0) {
              setBreathPhase('holdAfter');
              return selectedBreathTech.holdAfterExhaleSec;
            } else {
              setCompletedBreathCycles(c => c + 1);
              setBreathPhase('inhale');
              return selectedBreathTech.inhaleSec;
            }
          } else {
            setCompletedBreathCycles(c => c + 1);
            setBreathPhase('inhale');
            return selectedBreathTech.inhaleSec;
          }
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBreathingRunning, breathPhase, selectedBreathTech]);

  const toggleBreathing = () => {
    if (!isBreathingRunning) {
      spiritualAudio.playZenBowl(340, 2);
      setBreathPhase('inhale');
      setBreathCountdown(selectedBreathTech.inhaleSec);
      setIsBreathingRunning(true);
    } else {
      setIsBreathingRunning(false);
    }
  };

  // --- AMBIENT SOUND GENERATOR MATRIX ---
  const [activeSounds, setActiveSounds] = useState<{ [id: string]: boolean }>({});
  const [volumes, setVolumes] = useState<{ [id: string]: number }>({
    'tone-432': 0.25,
    'tone-528': 0.25,
    'tone-om': 0.3,
    'noise-rain': 0.2,
    'noise-ocean': 0.2,
    'noise-stream': 0.2
  });

  const toggleAmbientSound = (sound: typeof AMBIENT_SOUNDS[number]) => {
    const isCurrentlyOn = !!activeSounds[sound.id];
    if (isCurrentlyOn) {
      spiritualAudio.stopContinuous(sound.id);
      setActiveSounds(prev => ({ ...prev, [sound.id]: false }));
    } else {
      const vol = volumes[sound.id] ?? 0.25;
      if (sound.type === 'tone') {
        spiritualAudio.toggleContinuousTone(sound.id, sound.freq, vol);
      } else {
        spiritualAudio.toggleNoise(sound.id, sound.filter, sound.cutoff, vol);
      }
      setActiveSounds(prev => ({ ...prev, [sound.id]: true }));
    }
  };

  const handleVolumeChange = (soundId: string, val: number) => {
    setVolumes(prev => ({ ...prev, [soundId]: val }));
    spiritualAudio.setVolume(soundId, val);
  };

  const stopAllSounds = () => {
    spiritualAudio.stopAll();
    setActiveSounds({});
  };

  // --- GRATITUDE JOURNAL & WISDOM ---
  const [gratitudeEntries, setGratitudeEntries] = useState<{ id: string; date: string; items: string[] }[]>(() => {
    const saved = localStorage.getItem('newage_gratitude_journal');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [
      {
        id: '1',
        date: 'Сегодня',
        items: [
          'За ясное утреннее солнце и глубокий вдох',
          'За поддержку близких и вдохновляющие идеи',
          'За возможность учиться, созидать и быть в гармонии'
        ]
      }
    ];
  });
  const [g1, setG1] = useState('');
  const [g2, setG2] = useState('');
  const [g3, setG3] = useState('');

  const handleSaveGratitude = (e: React.FormEvent) => {
    e.preventDefault();
    if (!g1.trim() && !g2.trim() && !g3.trim()) return;
    const newEntry = {
      id: `gratitude-${Date.now()}`,
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
      items: [g1, g2, g3].filter(item => item.trim().length > 0)
    };
    const updated = [newEntry, ...gratitudeEntries];
    setGratitudeEntries(updated);
    localStorage.setItem('newage_gratitude_journal', JSON.stringify(updated));
    setG1('');
    setG2('');
    setG3('');
    spiritualAudio.playCrystalChime();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Render sponsored in-section ad banner
  const renderSectionAdBanner = (category: 'yoga' | 'meditation' | 'affirmations' | 'breathing') => {
    const sponsoredCourse = coursesList.find(c => 
      c.isSponsored && (c.sponsoredPlacement?.includes(category) || c.sponsoredPlacement?.includes('all'))
    );
    if (!sponsoredCourse) return null;

    const priceInfo = getCoursePrice(sponsoredCourse);

    return (
      <div className="section-ad-banner">
        <div className="ad-banner-glow" style={{ background: sponsoredCourse.bgGradient }} />
        <div className="ad-banner-badge">
          <Megaphone size={13} />
          <span>РЕКЛАМА • ПАРТНЁРСКИЙ КУРС</span>
        </div>
        <div className="ad-banner-main">
          <div className="ad-author-pill">
            <img src={sponsoredCourse.authorAvatar} alt={sponsoredCourse.authorName} className="ad-author-avatar" />
            <span>{sponsoredCourse.authorName}</span>
            {sponsoredCourse.authorVerified && <Check size={12} className="ad-verified-icon" />}
          </div>
          <h4 className="ad-course-title">{sponsoredCourse.title}</h4>
          <p className="ad-course-desc">{sponsoredCourse.subtitle}</p>
          <div className="ad-course-meta-row">
            <span className="ad-meta-item"><Star size={13} className="star-filled" /> {sponsoredCourse.rating} ({sponsoredCourse.studentsCount} учеников)</span>
            <span className="ad-meta-item">⏱ {sponsoredCourse.durationLabel}</span>
          </div>
        </div>

        <div className="ad-banner-action">
          <div className="ad-price-block">
            {priceInfo.hasDiscount && (
              <span className="ad-old-price">{priceInfo.original}</span>
            )}
            <span className="ad-current-price">{priceInfo.discounted}</span>
            {priceInfo.hasDiscount && (
              <span className="ad-discount-tag">-{priceInfo.percent}%</span>
            )}
          </div>
          <button 
            className="ad-enroll-btn"
            onClick={() => setSelectedCourseForPurchase(sponsoredCourse)}
          >
            <span>Записаться на курс</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="spiritual-page-container">
        <div className="messenger-guest-lock-container">
          <GuestLockPrompt
            featureName="Самопознание и духовные практики"
            title="Раздел практик доступен после регистрации"
            description="Погрузитесь в медитации с частотой 432 Гц, авторские уроки йоги, трансформационные аффирмации и Академию курсов мастеров после создания аккаунта."
            actionText="Войти или зарегистрироваться"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="spiritual-page-container">
      {/* Top Banner Hero */}
      <div className="spiritual-hero-card">
        <div className="spiritual-hero-glow" />
        <div className="spiritual-hero-content">
          <div className="spiritual-tag-pill">
            <Sparkles size={14} className="tag-sparkle-icon" />
            <span>ДУХОВНАЯ ЭКОСИСТЕМА NEW AGE</span>
          </div>
          <h1 className="spiritual-main-title">Самопознание и Практики</h1>
          <p className="spiritual-subtitle">
            Пространство тишины, осознанности и коммерческая академия мастеров. Медитации 432 Гц, древняя йога, аффирмации, пранаяма и авторские курсы с оплатой в любой мировой валюте.
          </p>

          {/* Quick Metrics */}
          <div className="spiritual-metrics-strip">
            <div className="metric-pill">
              <span className="metric-num">{meditationMinutesTotal} мин</span>
              <span className="metric-lbl">Осознанности</span>
            </div>
            <div className="metric-pill">
              <span className="metric-num">{acceptedCount}</span>
              <span className="metric-lbl">Установок принято</span>
            </div>
            <div className="metric-pill">
              <span className="metric-num">{coursesList.length}</span>
              <span className="metric-lbl">Курсов в Академии</span>
            </div>
            <div className="metric-pill">
              <span className="metric-num">9 валют</span>
              <span className="metric-lbl">Мультивалютная оплата</span>
            </div>
          </div>
        </div>

        <div className="spiritual-hero-quote-box">
          <div className="quote-tradition-tag">Мудрость Дня</div>
          <p className="quote-text">«Тот, кто побеждает других — силен. Тот, кто постигает себя — истинно могущественен.»</p>
          <span className="quote-author">— Лао-цзы, Дао Дэ Цзин</span>
          <button 
            type="button" 
            className="chime-test-btn" 
            onClick={() => spiritualAudio.playZenBowl(432, 4)}
            title="Очищающий звон поющей чаши"
          >
            <Sparkles size={14} />
            <span>Звон тибетской чаши</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="spiritual-tabs-bar">
        <button 
          className={`spiritual-tab-btn ${activeTab === 'meditation' ? 'active' : ''}`}
          onClick={() => handleTabChange('meditation')}
        >
          <Flower2 size={18} />
          <span>Медитация</span>
        </button>

        <button 
          className={`spiritual-tab-btn ${activeTab === 'yoga' ? 'active' : ''}`}
          onClick={() => handleTabChange('yoga')}
        >
          <Activity size={18} />
          <span>Йога</span>
        </button>

        <button 
          className={`spiritual-tab-btn ${activeTab === 'affirmations' ? 'active' : ''}`}
          onClick={() => handleTabChange('affirmations')}
        >
          <Sunrise size={18} />
          <span>Аффирмации</span>
        </button>

        <button 
          className={`spiritual-tab-btn ${activeTab === 'breathing' ? 'active' : ''}`}
          onClick={() => handleTabChange('breathing')}
        >
          <Wind size={18} />
          <span>Дыхание</span>
        </button>

        <button 
          className={`spiritual-tab-btn ${activeTab === 'sounds' ? 'active' : ''}`}
          onClick={() => handleTabChange('sounds')}
        >
          <Waves size={18} />
          <span>Звуки & Мантры</span>
        </button>

        <button 
          className={`spiritual-tab-btn ${activeTab === 'wisdom' ? 'active' : ''}`}
          onClick={() => handleTabChange('wisdom')}
        >
          <BookOpen size={18} />
          <span>Мудрость</span>
        </button>

        <button 
          className={`spiritual-tab-btn tab-btn-courses ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => handleTabChange('courses')}
        >
          <GraduationCap size={18} />
          <span>Курсы & Маркет</span>
          <span className="tab-hot-badge">PRO</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: МЕДИТАЦИЯ */}
      {/* ========================================================================= */}
      {activeTab === 'meditation' && (
        <div className="spiritual-tab-content">
          {/* In-section Sponsored Course Ad Banner */}
          {renderSectionAdBanner('meditation')}

          <div className="meditation-grid-layout">
            {/* Left: Interactive Zen Timer */}
            <div className="meditation-timer-card">
              <div className="timer-header-row">
                <h3 className="section-card-title">Таймер Осознанности</h3>
                <span className="zen-live-badge">
                  {isTimerRunning ? '● Практика идёт' : 'Готов к погружению'}
                </span>
              </div>

              {/* Preset Duration Pills */}
              <div className="timer-presets-row">
                {[3, 5, 10, 15, 20, 30].map(mins => (
                  <button
                    key={mins}
                    disabled={isTimerRunning}
                    className={`preset-pill ${timerMinutes === mins ? 'active' : ''}`}
                    onClick={() => setTimerMinutes(mins)}
                  >
                    {mins} мин
                  </button>
                ))}
              </div>

              {/* Big Circular Clock Display */}
              <div className="timer-display-ring">
                <div className={`timer-ring-glow ${isTimerRunning ? 'pulse' : ''}`} />
                <div className="timer-digits-wrapper">
                  <div className="timer-countdown-text">
                    {formatTime(timerSecondsLeft)}
                  </div>
                  <span className="timer-phase-caption">
                    {isTimerRunning ? 'Наблюдайте дыхание' : 'Нажмите старт для начала'}
                  </span>
                </div>
              </div>

              {/* Background sound picker */}
              <div className="timer-sound-picker">
                <span className="picker-label">Фоновый звук:</span>
                <div className="sound-options-group">
                  <button 
                    className={`sound-opt-btn ${selectedBgSound === 'none' ? 'active' : ''}`}
                    onClick={() => setSelectedBgSound('none')}
                  >
                    Тишина
                  </button>
                  <button 
                    className={`sound-opt-btn ${selectedBgSound === '432' ? 'active' : ''}`}
                    onClick={() => setSelectedBgSound('432')}
                  >
                    432 Гц
                  </button>
                  <button 
                    className={`sound-opt-btn ${selectedBgSound === 'rain' ? 'active' : ''}`}
                    onClick={() => setSelectedBgSound('rain')}
                  >
                    Дождь
                  </button>
                  <button 
                    className={`sound-opt-btn ${selectedBgSound === 'waves' ? 'active' : ''}`}
                    onClick={() => setSelectedBgSound('waves')}
                  >
                    Прибой
                  </button>
                </div>
              </div>

              {/* Timer Controls */}
              <div className="timer-action-buttons">
                <button 
                  className={`timer-primary-btn ${isTimerRunning ? 'running' : ''}`}
                  onClick={handleToggleTimer}
                >
                  {isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
                  <span>{isTimerRunning ? 'Пауза' : 'Начать медитацию'}</span>
                </button>
                <button 
                  className="timer-reset-btn"
                  onClick={handleResetTimer}
                  title="Сбросить таймер"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>

            {/* Right: Curated Meditation Tracks */}
            <div className="meditation-tracks-column">
              <h3 className="section-card-title">Тематические Сессии и Частоты</h3>
              <p className="section-desc">Выберите направленную практику под ваше сегодняшнее внутреннее состояние.</p>

              <div className="tracks-list">
                {MEDITATION_TRACKS.map(track => (
                  <div key={track.id} className="track-card">
                    <div className="track-gradient-bar" style={{ background: track.bgGradient }} />
                    <div className="track-info">
                      <div className="track-top-meta">
                        <span className="track-badge">{track.category}</span>
                        <span className="track-freq">{track.frequencyLabel}</span>
                        <span className="track-duration">{track.durationMin} мин</span>
                      </div>
                      <h4 className="track-title">{track.title}</h4>
                      <p className="track-desc">{track.description}</p>
                    </div>
                    <button 
                      className="track-play-button"
                      onClick={() => {
                        setTimerMinutes(track.durationMin);
                        setSelectedBgSound(track.soundType === 'bowl' ? '432' : track.soundType);
                        spiritualAudio.playZenBowl(432, 3);
                      }}
                      title="Выбрать эту практику"
                    >
                      <Play size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ЙОГА */}
      {/* ========================================================================= */}
      {activeTab === 'yoga' && (
        <div className="spiritual-tab-content">
          {/* In-section Sponsored Course Ad Banner for Yoga */}
          {renderSectionAdBanner('yoga')}

          {activeRoutine ? (
            <div className="yoga-practice-session-card">
              <div className="practice-header">
                <div>
                  <div className="practice-routine-title">{activeRoutine.title}</div>
                  <div className="practice-pose-counter">
                    Асана {currentPoseIdx + 1} из {activeRoutine.poses.length}
                  </div>
                </div>
                <button className="practice-exit-btn" onClick={stopRoutine}>
                  Завершить практику
                </button>
              </div>

              {/* Current Asana Active Card */}
              <div className="active-asana-stage">
                <div className="asana-sanskrit-tag">{activeRoutine.poses[currentPoseIdx].sanskritName}</div>
                <h2 className="asana-name-heading">{activeRoutine.poses[currentPoseIdx].name}</h2>
                <p className="asana-instruction">{activeRoutine.poses[currentPoseIdx].description}</p>

                <div className="asana-benefits-grid">
                  <div className="benefit-cell">
                    <span className="cell-label">Польза:</span>
                    <span className="cell-val">{activeRoutine.poses[currentPoseIdx].benefit}</span>
                  </div>
                  <div className="benefit-cell">
                    <span className="cell-label">Дыхание:</span>
                    <span className="cell-val">{activeRoutine.poses[currentPoseIdx].breathing}</span>
                  </div>
                  <div className="benefit-cell">
                    <span className="cell-label">Чакры и фокус:</span>
                    <span className="cell-val">{activeRoutine.poses[currentPoseIdx].chakra}</span>
                  </div>
                </div>

                {/* Pose Timer */}
                <div className="pose-timer-circle">
                  <span className="pose-timer-num">{poseSecondsLeft}с</span>
                  <span className="pose-timer-sub">удержание</span>
                </div>

                {/* Navigation controls */}
                <div className="practice-nav-controls">
                  <button 
                    className="practice-nav-btn" 
                    disabled={currentPoseIdx === 0}
                    onClick={() => {
                      const prev = currentPoseIdx - 1;
                      setCurrentPoseIdx(prev);
                      setPoseSecondsLeft(activeRoutine.poses[prev].durationSec);
                    }}
                  >
                    <ChevronLeft size={18} />
                    <span>Предыдущая асана</span>
                  </button>

                  <button 
                    className="practice-toggle-timer-btn"
                    onClick={() => setIsPoseRunning(!isPoseRunning)}
                  >
                    {isPoseRunning ? <Pause size={18} /> : <Play size={18} />}
                    <span>{isPoseRunning ? 'Пауза' : 'Продолжить'}</span>
                  </button>

                  <button 
                    className="practice-nav-btn"
                    disabled={currentPoseIdx === activeRoutine.poses.length - 1}
                    onClick={() => {
                      const next = currentPoseIdx + 1;
                      setCurrentPoseIdx(next);
                      setPoseSecondsLeft(activeRoutine.poses[next].durationSec);
                      spiritualAudio.playZenBowl(528, 2);
                    }}
                  >
                    <span>Следующая асана</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="yoga-catalog-grid">
              <div className="yoga-intro-box">
                <h3 className="section-card-title">Комплексы Йоги и Осознанного Движения</h3>
                <p className="section-desc">
                  Практики адаптированы под любой уровень подготовки. Выполняйте асаны в собственном комфортном ритме, сохраняя внимание на ровном дыхании.
                </p>
              </div>

              <div className="routines-deck">
                {YOGA_ROUTINES.map(routine => (
                  <div key={routine.id} className="routine-card">
                    <div className="routine-banner" style={{ background: routine.bgGradient }}>
                      <div className="routine-badge-row">
                        <span className="routine-level-badge">{routine.level}</span>
                        <span className="routine-category-badge">{routine.category}</span>
                      </div>
                      <h3 className="routine-title">{routine.title}</h3>
                      <div className="routine-subtitle">{routine.subtitle}</div>
                    </div>

                    <div className="routine-body">
                      <p className="routine-desc">{routine.description}</p>
                      
                      <div className="routine-meta-items">
                        <div className="routine-meta-pill">⏱ {routine.durationMin} минут</div>
                        <div className="routine-meta-pill">🔥 ~{routine.caloriesBurn} ккал</div>
                        <div className="routine-meta-pill">🧘 {routine.poses.length} асан</div>
                      </div>

                      <div className="routine-poses-preview">
                        <span className="poses-preview-title">Ключевые асаны:</span>
                        <ul className="poses-bullet-list">
                          {routine.poses.slice(0, 3).map((p, idx) => (
                            <li key={idx}>{p.name} <span className="sanskrit-note">({p.sanskritName})</span></li>
                          ))}
                        </ul>
                      </div>

                      <button 
                        className="start-routine-btn"
                        onClick={() => startRoutine(routine)}
                      >
                        <Play size={16} />
                        <span>Начать практику</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: АФФИРМАЦИИ */}
      {/* ========================================================================= */}
      {activeTab === 'affirmations' && (
        <div className="spiritual-tab-content">
          {/* In-section Sponsored Course Ad Banner for Affirmations */}
          {renderSectionAdBanner('affirmations')}

          <div className="affirmations-layout">
            <div className="affirmation-spotlight-card">
              <div className="spotlight-tag">
                <Sunrise size={16} />
                <span>Аффирмация Дня</span>
              </div>

              <div className={`spotlight-body ${isFlipping ? 'flipping' : ''}`}>
                <div className="spotlight-category-chip">{dailyAffirmation.categoryLabel}</div>
                <blockquote className="spotlight-text">
                  «{dailyAffirmation.text}»
                </blockquote>
              </div>

              <div className="spotlight-action-row">
                <button 
                  className="affirmation-draw-btn"
                  onClick={getRandomAffirmation}
                >
                  <Sparkles size={18} />
                  <span>Случайная аффирмация</span>
                </button>

                <button 
                  className="affirmation-accept-btn"
                  onClick={handleAcceptAffirmation}
                  title="Закрепить установку в подсознании"
                >
                  <CheckCircle2 size={18} />
                  <span>Принять установку ({acceptedCount})</span>
                </button>
              </div>
            </div>

            <div className="create-affirmation-card">
              <h3 className="section-card-title">Создать Свою Установку</h3>
              <p className="section-desc">Сформулируйте намерение в настоящем времени от первого лица.</p>

              <form onSubmit={handleAddAffirmation} className="affirmation-form">
                <div className="form-input-group">
                  <input 
                    type="text"
                    value={newAffText}
                    onChange={(e) => setNewAffText(e.target.value)}
                    placeholder="Например: Моё сердце наполнено безграничной любовью и покоем..."
                    className="aff-text-input"
                  />
                  <button type="submit" className="aff-submit-btn">
                    <Plus size={18} />
                    <span>Добавить</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="affirmations-list-section">
              <div className="category-filter-row">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'harmony', label: 'Гармония' },
                  { id: 'abundance', label: 'Изобилие' },
                  { id: 'self-love', label: 'Любовь к себе' },
                  { id: 'power', label: 'Сила духа' },
                  { id: 'health', label: 'Здоровье' }
                ].map(cat => (
                  <button 
                    key={cat.id}
                    className={`cat-pill ${affirmationCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setAffirmationCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="affirmations-grid">
                {affirmationsList
                  .filter(a => affirmationCategory === 'all' || a.category === affirmationCategory)
                  .map(aff => (
                    <div key={aff.id} className="aff-card-item">
                      <div className="aff-card-top">
                        <span className="aff-cat-badge">{aff.categoryLabel}</span>
                        {aff.id.startsWith('custom-') && (
                          <button 
                            className="aff-delete-btn" 
                            onClick={() => handleDeleteAffirmation(aff.id)}
                            title="Удалить"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <p className="aff-card-text">«{aff.text}»</p>
                      <button 
                        className="aff-card-focus-btn"
                        onClick={() => {
                          setDailyAffirmation(aff);
                          spiritualAudio.playCrystalChime();
                        }}
                      >
                        Медитировать над этой установкой
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ДЫХАТЕЛЬНЫЕ ПРАКТИКИ */}
      {/* ========================================================================= */}
      {activeTab === 'breathing' && (
        <div className="spiritual-tab-content">
          {/* In-section Sponsored Course Ad Banner for Breathing */}
          {renderSectionAdBanner('breathing')}

          <div className="breathing-page-layout">
            <div className="breathing-tech-selector">
              {BREATHING_TECHNIQUES.map(tech => (
                <div 
                  key={tech.id}
                  className={`tech-card ${selectedBreathTech.id === tech.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedBreathTech(tech);
                    setIsBreathingRunning(false);
                    setBreathCountdown(tech.inhaleSec);
                  }}
                >
                  <h4 className="tech-title">{tech.title}</h4>
                  <div className="tech-subtitle">{tech.subtitle}</div>
                  <p className="tech-purpose">{tech.purpose}</p>
                </div>
              ))}
            </div>

            <div className="breathing-stage-card">
              <div className="breathing-counter-badge">
                Завершено циклов: <strong>{completedBreathCycles}</strong>
              </div>

              <div className="breathing-orb-container">
                <div className={`breathing-orb phase-${breathPhase} ${isBreathingRunning ? 'active' : 'idle'}`}>
                  <div className="orb-center-content">
                    <span className="orb-phase-word">
                      {isBreathingRunning ? (
                        breathPhase === 'inhale' ? 'Вдох' :
                        breathPhase === 'hold' ? 'Задержка' :
                        breathPhase === 'exhale' ? 'Выдох' : 'Пауза'
                      ) : 'Готовы?'}
                    </span>
                    <span className="orb-countdown-num">
                      {isBreathingRunning ? `${breathCountdown}с` : 'Start'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="breathing-instruction-hint">
                {isBreathingRunning ? (
                  breathPhase === 'inhale' ? 'Вдыхайте мягко и глубоко через нос, наполняя живот и грудь...' :
                  breathPhase === 'hold' ? 'Удерживайте воздух в лёгких, сохраняя плечи расслабленными...' :
                  breathPhase === 'exhale' ? 'Медленно и плавно выдыхайте через приоткрытый рот...' :
                  'Мягкая пауза перед следующим вдохом...'
                ) : 'Нажмите кнопку ниже для запуска практики осознанного дыхания.'}
              </p>

              <button 
                className={`breathing-toggle-btn ${isBreathingRunning ? 'running' : ''}`}
                onClick={toggleBreathing}
              >
                {isBreathingRunning ? <Pause size={20} /> : <Play size={20} />}
                <span>{isBreathingRunning ? 'Остановить практику' : 'Начать дыхание'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ЗВУКИ И МАНТРЫ */}
      {/* ========================================================================= */}
      {activeTab === 'sounds' && (
        <div className="spiritual-tab-content">
          <div className="sounds-header-bar">
            <div>
              <h3 className="section-card-title">Генератор Исцеляющих Частот и Природных Шумов</h3>
              <p className="section-desc">
                Создайте собственный индивидуальный микс звуков для медитации, глубокого сна или глубокой работы.
              </p>
            </div>
            <button className="sounds-stop-all-btn" onClick={stopAllSounds}>
              <VolumeX size={16} />
              <span>Остановить все звуки</span>
            </button>
          </div>

          <div className="sounds-matrix-grid">
            {AMBIENT_SOUNDS.map(sound => {
              const isOn = !!activeSounds[sound.id];
              return (
                <div key={sound.id} className={`sound-channel-card ${isOn ? 'active' : ''}`}>
                  <div className="channel-top">
                    <div>
                      <h4 className="channel-title">{sound.title}</h4>
                      <div className="channel-sub">{sound.subtitle}</div>
                    </div>
                    <button 
                      className={`channel-toggle-btn ${isOn ? 'on' : 'off'}`}
                      onClick={() => toggleAmbientSound(sound)}
                    >
                      {isOn ? <Volume2 size={20} /> : <Play size={18} />}
                    </button>
                  </div>

                  <div className="channel-slider-row">
                    <span className="vol-icon"><Volume2 size={14} /></span>
                    <input 
                      type="range" 
                      min="0.01" 
                      max="0.5" 
                      step="0.01"
                      value={volumes[sound.id] ?? 0.25}
                      onChange={(e) => handleVolumeChange(sound.id, parseFloat(e.target.value))}
                      className="vol-slider"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: МУДРОСТЬ & ДНЕВНИК */}
      {/* ========================================================================= */}
      {activeTab === 'wisdom' && (
        <div className="spiritual-tab-content">
          <div className="wisdom-layout-grid">
            <div className="gratitude-journal-card">
              <h3 className="section-card-title">Дневник Осознанности и Благодарности</h3>
              <p className="section-desc">
                Запишите три вещи, за которые вы искренне благодарны сегодня. Это перестраивает нейронные связи на состояние гармонии и изобилия.
              </p>

              <form onSubmit={handleSaveGratitude} className="gratitude-form">
                <div className="gratitude-row">
                  <span className="g-idx">1.</span>
                  <input 
                    type="text" 
                    value={g1} 
                    onChange={e => setG1(e.target.value)} 
                    placeholder="Я благодарен за..." 
                    className="g-input"
                  />
                </div>
                <div className="gratitude-row">
                  <span className="g-idx">2.</span>
                  <input 
                    type="text" 
                    value={g2} 
                    onChange={e => setG2(e.target.value)} 
                    placeholder="Я благодарен за..." 
                    className="g-input"
                  />
                </div>
                <div className="gratitude-row">
                  <span className="g-idx">3.</span>
                  <input 
                    type="text" 
                    value={g3} 
                    onChange={e => setG3(e.target.value)} 
                    placeholder="Я благодарен за..." 
                    className="g-input"
                  />
                </div>
                <button type="submit" className="save-gratitude-btn">
                  <Heart size={16} />
                  <span>Сохранить в дневник</span>
                </button>
              </form>

              <div className="journal-history-list">
                <h4 className="history-title">Мои записи благодарности</h4>
                {gratitudeEntries.map(entry => (
                  <div key={entry.id} className="history-card">
                    <span className="history-date">{entry.date}</span>
                    <ul className="history-bullet-list">
                      {entry.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="wisdom-quotes-column">
              <h3 className="section-card-title">Жемчужины Древней Мудрости</h3>
              <p className="section-desc">Вечные наставления учителей Востока и Запада.</p>

              <div className="quotes-stack">
                {WISDOM_QUOTES.map(quote => (
                  <div key={quote.id} className="wisdom-quote-card">
                    <div className="quote-tradition">{quote.tradition}</div>
                    <p className="quote-body">«{quote.text}»</p>
                    <div className="quote-author-line">— {quote.author}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: КУРСЫ & МАРКЕТ ПРАКТИК (COMMERCE & ADS) */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="spiritual-tab-content">
          {/* Top Control Bar: Currency Selector & Publish Button */}
          <div className="courses-hub-top-bar">
            <div className="currency-selector-box">
              <span className="currency-selector-label">Отображать цены в валюте:</span>
              <div className="currency-pills-list">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map(cCode => (
                  <button 
                    key={cCode}
                    className={`curr-pill-btn ${selectedCurrency === cCode ? 'active' : ''}`}
                    onClick={() => handleCurrencyChange(cCode)}
                    title={CURRENCIES[cCode].name}
                  >
                    <span>{CURRENCIES[cCode].symbol}</span>
                    <span className="curr-code-name">{cCode}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="publish-course-cta-btn"
              onClick={() => setIsCreateCourseModalOpen(true)}
            >
              <Plus size={18} />
              <span>Опубликовать курс / Рекламу</span>
            </button>
          </div>

          {/* Courses Category Filter */}
          <div className="courses-category-filter-row">
            {[
              { id: 'all', label: 'Все направления' },
              { id: 'yoga', label: 'Йога' },
              { id: 'meditation', label: 'Медитация' },
              { id: 'affirmations', label: 'Аффирмации и Мышление' },
              { id: 'breathing', label: 'Дыхание' },
              { id: 'soundhealing', label: 'Саундхилинг' },
              { id: 'retreats', label: 'Живые Ретриты' }
            ].map(cat => (
              <button
                key={cat.id}
                className={`course-cat-pill ${courseCategoryFilter === cat.id ? 'active' : ''}`}
                onClick={() => setCourseCategoryFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Course Cards Grid */}
          <div className="courses-marketplace-grid">
            {coursesList
              .filter(course => courseCategoryFilter === 'all' || course.category === courseCategoryFilter)
              .map(course => {
                const price = getCoursePrice(course);

                return (
                  <div key={course.id} className={`course-market-card ${course.isSponsored ? 'is-sponsored-card' : ''}`}>
                    {/* Top Banner with Author and Badge */}
                    <div className="course-card-hero" style={{ background: course.bgGradient }}>
                      <div className="course-badge-line">
                        <span className="course-main-badge">{course.badgeLabel || course.categoryLabel}</span>
                        <span className="course-format-badge">{course.format}</span>
                      </div>
                      <h3 className="course-title-text">{course.title}</h3>
                      <p className="course-subtitle-text">{course.subtitle}</p>
                    </div>

                    <div className="course-card-body">
                      {/* Author Info Row */}
                      <div className="course-author-row">
                        <img src={course.authorAvatar} alt={course.authorName} className="course-author-img" />
                        <div className="course-author-meta">
                          <div className="course-author-name-line">
                            <span className="author-bold-name">{course.authorName}</span>
                            {course.authorVerified && <Check size={14} className="verified-check" />}
                          </div>
                          <span className="author-role-sub">{course.authorRole}</span>
                        </div>
                      </div>

                      <div className="course-stats-strip">
                        <div className="stat-bubble">
                          <Star size={14} className="star-filled" />
                          <span>{course.rating}</span>
                        </div>
                        <div className="stat-bubble">
                          <span>{course.studentsCount} учеников</span>
                        </div>
                        <div className="stat-bubble">
                          <span>⏱ {course.durationLabel}</span>
                        </div>
                      </div>

                      {/* Course Key Highlights */}
                      <ul className="course-highlights-list">
                        {course.highlights.slice(0, 3).map((item, idx) => (
                          <li key={idx}>
                            <Check size={13} className="bullet-check" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Price & Buy Action */}
                      <div className="course-pricing-action-box">
                        <div className="pricing-left">
                          {price.hasDiscount && (
                            <span className="pricing-old">{price.original}</span>
                          )}
                          <div className="pricing-active-row">
                            <span className="pricing-final">{price.discounted}</span>
                            {price.hasDiscount && (
                              <span className="pricing-percent-tag">-{price.percent}%</span>
                            )}
                          </div>
                        </div>

                        <button 
                          className="enroll-course-btn"
                          onClick={() => setSelectedCourseForPurchase(course)}
                        >
                          <span>Записаться</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / PUBLISH COURSE OR AD */}
      {/* ========================================================================= */}
      {isCreateCourseModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateCourseModalOpen(false)}>
          <div className="publish-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 className="modal-title">Разместить курс или рекламу</h3>
                <p className="modal-desc">Опубликуйте свою авторскую программу и начните принимать оплаты от аудитории.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsCreateCourseModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCourseSubmit} className="publish-form">
              <div className="form-group">
                <label className="form-label">Название курса / программы *</label>
                <input 
                  type="text" 
                  required
                  value={newCourseTitle}
                  onChange={e => setNewCourseTitle(e.target.value)}
                  placeholder="Например: Интенсив по Хатха-Йоге и Чакровому Дыханию"
                  className="form-control"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Направление / Категория</label>
                  <select 
                    value={newCourseCategory}
                    onChange={e => setNewCourseCategory(e.target.value as SpiritualCourse['category'])}
                    className="form-control"
                  >
                    <option value="yoga">Йога</option>
                    <option value="meditation">Медитация</option>
                    <option value="affirmations">Аффирмации и Мышление</option>
                    <option value="breathing">Дыхание и Пранаяма</option>
                    <option value="soundhealing">Саундхилинг</option>
                    <option value="retreats">Ретриты</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Формат обучения</label>
                  <select 
                    value={newCourseFormat}
                    onChange={e => setNewCourseFormat(e.target.value as SpiritualCourse['format'])}
                    className="form-control"
                  >
                    <option value="Видеокурс">Видеокурс</option>
                    <option value="Интенсив">Онлайн-интенсив</option>
                    <option value="Наставничество">Личное наставничество</option>
                    <option value="Ретрит">Выездной ретрит</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Длительность / Программа</label>
                  <input 
                    type="text"
                    value={newCourseDuration}
                    onChange={e => setNewCourseDuration(e.target.value)}
                    placeholder="Например: 4 недели • 12 уроков"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Имя мастера / Школы *</label>
                  <input 
                    type="text" 
                    required
                    value={newCourseAuthorName}
                    onChange={e => setNewCourseAuthorName(e.target.value)}
                    placeholder="Например: Мастер Ананта"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Статус / Регалии автора</label>
                  <input 
                    type="text" 
                    value={newCourseAuthorRole}
                    onChange={e => setNewCourseAuthorRole(e.target.value)}
                    placeholder="Например: Инструктор международного альянса йоги"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Базовая стоимость *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={newCoursePrice}
                    onChange={e => setNewCoursePrice(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Валюта курса</label>
                  <select 
                    value={newCourseCurrency}
                    onChange={e => setNewCourseCurrency(e.target.value as CurrencyCode)}
                    className="form-control"
                  >
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map(code => (
                      <option key={code} value={code}>{code} ({CURRENCIES[code].symbol}) - {CURRENCIES[code].name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Скидка (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="90"
                    value={newCourseDiscount}
                    onChange={e => setNewCourseDiscount(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Краткое описание и программа</label>
                <textarea 
                  rows={3}
                  value={newCourseDescription}
                  onChange={e => setNewCourseDescription(e.target.value)}
                  placeholder="Опишите, чему научатся участники и какие результаты получат..."
                  className="form-control"
                />
              </div>

              {/* Promo Ads Option */}
              <div className="form-checkbox-card">
                <label className="checkbox-label-container">
                  <input 
                    type="checkbox" 
                    checked={newCourseIsSponsored}
                    onChange={e => setNewCourseIsSponsored(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <div>
                    <span className="checkbox-title">🔥 Запустить внутреннюю рекламу и продвижение</span>
                    <span className="checkbox-sub">
                      Курс будет отображаться в рекламных баннерах внутри разделов Йоги, Медитации и Аффирмаций с пометкой «Спонсировано».
                    </span>
                  </div>
                </label>
              </div>

              <div className="modal-action-row">
                <button type="button" className="btn-cancel" onClick={() => setIsCreateCourseModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn-submit-publish">
                  <Plus size={18} />
                  <span>Опубликовать курс в Маркете</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PURCHASE / ENROLL COURSE */}
      {/* ========================================================================= */}
      {selectedCourseForPurchase && (
        <div className="modal-backdrop" onClick={() => setSelectedCourseForPurchase(null)}>
          <div className="purchase-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="purchase-modal-tag">{selectedCourseForPurchase.categoryLabel}</span>
                <h3 className="modal-title">{selectedCourseForPurchase.title}</h3>
                <span className="purchase-author-sub">Автор: {selectedCourseForPurchase.authorName}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCourseForPurchase(null)}>
                <X size={20} />
              </button>
            </div>

            {purchaseSuccess ? (
              <div className="purchase-success-view">
                <div className="success-icon-circle">
                  <CheckCircle2 size={48} className="check-emerald" />
                </div>
                <h3>Оплата успешно завершена!</h3>
                <p>Доступ к курсу активирован. Все уроки и закрытый чат добавлены в ваш личный профиль.</p>
              </div>
            ) : (
              <div className="purchase-modal-content">
                <div className="purchase-overview-box">
                  <p className="purchase-desc">{selectedCourseForPurchase.description}</p>
                  
                  <div className="purchase-highlights-box">
                    <span className="highlights-title">Что входит в курс:</span>
                    <ul>
                      {selectedCourseForPurchase.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Price summary */}
                <div className="purchase-total-row">
                  <span className="total-label">Итого к оплате:</span>
                  <div className="total-price-box">
                    {getCoursePrice(selectedCourseForPurchase).hasDiscount && (
                      <span className="total-old-price">{getCoursePrice(selectedCourseForPurchase).original}</span>
                    )}
                    <span className="total-final-price">{getCoursePrice(selectedCourseForPurchase).discounted}</span>
                  </div>
                </div>

                {/* Payment method selection */}
                <div className="payment-methods-block">
                  <span className="pay-methods-title">Способ оплаты:</span>
                  <div className="pay-options-list">
                    <label className="pay-option-item active">
                      <input type="radio" name="pay_opt" defaultChecked />
                      <div>
                        <strong>Кошелёк New Age Pay (Баланс 14 850 ₽)</strong>
                        <span className="sub-opt-hint">Мгновенное списание без комиссии</span>
                      </div>
                    </label>
                    <label className="pay-option-item">
                      <input type="radio" name="pay_opt" />
                      <div>
                        <strong>Банковская карта (Мир, Visa, Mastercard)</strong>
                        <span className="sub-opt-hint">Любые российские и зарубежные карты</span>
                      </div>
                    </label>
                    <label className="pay-option-item">
                      <input type="radio" name="pay_opt" />
                      <div>
                        <strong>Криптовалюта (USDT / TON / New Age Token)</strong>
                        <span className="sub-opt-hint">Автоматическое зачисление после 1 подтверждения сети</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="modal-action-row">
                  <button className="btn-cancel" onClick={() => setSelectedCourseForPurchase(null)}>
                    Отмена
                  </button>
                  <button className="btn-confirm-pay" onClick={handleSimulatePurchase}>
                    <span>Оплатить {getCoursePrice(selectedCourseForPurchase).discounted}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
