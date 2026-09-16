import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Calendar, Heart, Briefcase, Activity, 
  Lightbulb, Compass, Share2, Check,
  Moon, Star, Flame, Droplets, Wind, Mountain
} from 'lucide-react';
import { 
  ZODIAC_SIGNS_LIST, 
  calculateDailyHoroscope, 
  getZodiacByBirthDate, 
  type ZodiacSignInfo, 
  type DailyHoroscope 
} from '../utils/horoscopeEngine';
import './DailyHoroscopeSection.css';

interface DailyHoroscopeSectionProps {
  onOpenBooking?: (expertType: string) => void;
}

export const DailyHoroscopeSection: React.FC<DailyHoroscopeSectionProps> = ({ onOpenBooking }) => {
  // Текущая дата сегодня
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, [today]);

  // Выбранная дата для просмотра гороскопа
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return todayStr;
  });

  // Выбранный знак зодиака
  const [selectedSignId, setSelectedSignId] = useState<string>(() => {
    return localStorage.getItem('newage_user_zodiac') || 'aries';
  });

  // Форма ввода дня рождения пользователя для автоопределения знака
  const [birthDay, setBirthDay] = useState<number>(() => {
    const saved = localStorage.getItem('newage_birth_day');
    return saved ? Number(saved) : 15;
  });
  const [birthMonth, setBirthMonth] = useState<number>(() => {
    const saved = localStorage.getItem('newage_birth_month');
    return saved ? Number(saved) : 4;
  });
  const [birthYear, setBirthYear] = useState<number>(() => {
    const saved = localStorage.getItem('newage_birth_year');
    return saved ? Number(saved) : 1995;
  });

  const [copiedLink, setCopiedLink] = useState(false);

  // Активная вкладка внутри гороскопа (Общий, Любовь, Карьера, Здоровье)
  const [activeCategory, setActiveCategory] = useState<'all' | 'love' | 'career' | 'health'>('all');

  // Расчет гороскопа на выбранную дату
  const horoscope: DailyHoroscope = useMemo(() => {
    return calculateDailyHoroscope(selectedDate, selectedSignId, birthYear);
  }, [selectedDate, selectedSignId, birthYear]);

  // Смена знака
  const handleSelectSign = (sign: ZodiacSignInfo) => {
    setSelectedSignId(sign.id);
    localStorage.setItem('newage_user_zodiac', sign.id);
  };

  // Автоопределение знака по введенной дате рождения (день, месяц, год)
  const handleApplyBirthDate = (e: React.FormEvent) => {
    e.preventDefault();
    const sign = getZodiacByBirthDate(Number(birthDay), Number(birthMonth));
    setSelectedSignId(sign.id);
    localStorage.setItem('newage_user_zodiac', sign.id);
    localStorage.setItem('newage_birth_day', String(birthDay));
    localStorage.setItem('newage_birth_month', String(birthMonth));
    localStorage.setItem('newage_birth_year', String(birthYear));
  };

  // Быстрые переключатели: Вчера, Сегодня, Завтра
  const handleSetQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  // Поделиться гороскопом
  const handleShare = () => {
    const shareText = `Гороскоп для знака ${horoscope.sign.name} на ${horoscope.formattedDate}: "${horoscope.headline}" в New Age`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getElementIcon = (element: ZodiacSignInfo['element']) => {
    switch (element) {
      case 'Огонь': return <Flame size={14} className="element-fire" />;
      case 'Земля': return <Mountain size={14} className="element-earth" />;
      case 'Воздух': return <Wind size={14} className="element-air" />;
      case 'Вода': return <Droplets size={14} className="element-water" />;
    }
  };

  return (
    <div className="horoscope-container">
      {/* Hero Banner */}
      <div className="horoscope-hero-card" style={{ background: horoscope.sign.gradient }}>
        <div className="horoscope-hero-glow" />
        <div className="horoscope-hero-content">
          <div className="horoscope-badge-row">
            <span className="horoscope-pill-badge">
              <Sparkles size={14} />
              <span>Ежедневный Астропрогноз • День в день</span>
            </span>
            <span className="horoscope-date-pill">
              <Calendar size={13} />
              <span>{horoscope.dayType}: {horoscope.formattedDate}</span>
            </span>
          </div>

          <div className="horoscope-hero-main">
            <div className="horoscope-sign-symbol-large">
              <span>{horoscope.sign.symbol}</span>
            </div>
            <div className="horoscope-sign-info">
              <div className="horoscope-sign-name-row">
                <h1 className="horoscope-sign-title">{horoscope.sign.name}</h1>
                <span className="horoscope-latin-name">({horoscope.sign.latinName})</span>
              </div>
              <p className="horoscope-sign-range">{horoscope.sign.dateRange}</p>
              <div className="horoscope-meta-tags">
                <span className="meta-tag">
                  {getElementIcon(horoscope.sign.element)}
                  <span>Стихия: {horoscope.sign.element}</span>
                </span>
                <span className="meta-tag">
                  <Star size={13} />
                  <span>Планета: {horoscope.sign.rulingPlanet}</span>
                </span>
                <span className="meta-tag">
                  <Moon size={13} />
                  <span>{horoscope.moonPhaseToday}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Switcher: Вчера / Сегодня / Завтра + Выбор произвольной даты */}
      <div className="horoscope-date-controls-bar">
        <div className="quick-date-pills">
          <button 
            type="button" 
            className={`quick-pill ${horoscope.dayType === 'Вчера' ? 'active' : ''}`}
            onClick={() => handleSetQuickDate(-1)}
          >
            Вчера
          </button>
          <button 
            type="button" 
            className={`quick-pill ${horoscope.dayType === 'Сегодня' ? 'active' : ''}`}
            onClick={() => handleSetQuickDate(0)}
          >
            ✨ Сегодня ({new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })})
          </button>
          <button 
            type="button" 
            className={`quick-pill ${horoscope.dayType === 'Завтра' ? 'active' : ''}`}
            onClick={() => handleSetQuickDate(1)}
          >
            Завтра
          </button>
        </div>

        <div className="date-picker-wrap">
          <label htmlFor="horoscope-date-input" className="date-picker-label">
            <Calendar size={14} />
            <span>Выбрать точную дату:</span>
          </label>
          <input 
            id="horoscope-date-input"
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="horoscope-date-input"
          />
        </div>
      </div>

      {/* 12 Zodiac Signs Scroll Bar */}
      <div className="zodiac-signs-scroll-box">
        <div className="zodiac-signs-strip">
          {ZODIAC_SIGNS_LIST.map((sign) => {
            const isSelected = sign.id === selectedSignId;
            return (
              <button
                key={sign.id}
                type="button"
                className={`zodiac-sign-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectSign(sign)}
                style={{
                  borderColor: isSelected ? sign.color : undefined
                }}
              >
                <span className="zodiac-btn-symbol" style={{ color: isSelected ? '#ffffff' : sign.color }}>
                  {sign.symbol}
                </span>
                <span className="zodiac-btn-name">{sign.name}</span>
                <span className="zodiac-btn-dates">{sign.dateRange.split('—')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal Date of Birth Calculator (День, Месяц, Год) */}
      <div className="birth-calculator-box">
        <div className="birth-calc-header">
          <div className="birth-calc-title-line">
            <Compass size={18} className="birth-icon" />
            <h3>Узнать свой знак и персональный гороскоп по дате рождения</h3>
          </div>
          <p className="birth-calc-desc">
            Введите ваш день, месяц и год рождения — система автоматически рассчитает ваш знак зодиака и откалибрует прогноз на {horoscope.dayType.toLowerCase()}.
          </p>
        </div>

        <form onSubmit={handleApplyBirthDate} className="birth-calc-form">
          <div className="birth-field-group">
            <label>День</label>
            <input 
              type="number" 
              min="1" 
              max="31" 
              value={birthDay}
              onChange={(e) => setBirthDay(Number(e.target.value))}
              className="birth-input"
              required
            />
          </div>

          <div className="birth-field-group">
            <label>Месяц</label>
            <select 
              value={birthMonth} 
              onChange={(e) => setBirthMonth(Number(e.target.value))}
              className="birth-select"
            >
              <option value="1">Январь</option>
              <option value="2">Февраль</option>
              <option value="3">Март</option>
              <option value="4">Апрель</option>
              <option value="5">Май</option>
              <option value="6">Июнь</option>
              <option value="7">Июль</option>
              <option value="8">Август</option>
              <option value="9">Сентябрь</option>
              <option value="10">Октябрь</option>
              <option value="11">Ноябрь</option>
              <option value="12">Декабрь</option>
            </select>
          </div>

          <div className="birth-field-group">
            <label>Год рождения</label>
            <input 
              type="number" 
              min="1930" 
              max={new Date().getFullYear()} 
              value={birthYear}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              className="birth-input"
              required
            />
          </div>

          <button type="submit" className="birth-submit-btn">
            <Sparkles size={15} />
            <span>Определить мой гороскоп</span>
          </button>
        </form>
      </div>

      {/* Main Forecast Hero Card (Headline in user format "Вас ожидает...") */}
      <div className="forecast-headline-banner">
        <div className="headline-icon-pulse">
          <Sparkles size={24} color="#F59E0B" />
        </div>
        <div className="headline-text-content">
          <span className="headline-tag">Главное предсказание на {horoscope.dayType.toLowerCase()}:</span>
          <h2 className="headline-title">
            «{horoscope.sign.name}: {horoscope.headline}»
          </h2>
          <p className="headline-body">{horoscope.mainForecast}</p>
        </div>
      </div>

      {/* Astro Metrics Strip: Энергия, Удача, Счастливое число, Время, Цвет, Союзник */}
      <div className="astro-metrics-grid">
        <div className="astro-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' }}>
            <Activity size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{horoscope.energyLevel}%</span>
            <span className="metric-title">Энергия дня</span>
          </div>
          <div className="metric-progress-bar">
            <div className="metric-progress-fill" style={{ width: `${horoscope.energyLevel}%`, background: '#EF4444' }} />
          </div>
        </div>

        <div className="astro-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
            <Star size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{horoscope.luckPercentage}%</span>
            <span className="metric-title">Индекс удачи</span>
          </div>
          <div className="metric-progress-bar">
            <div className="metric-progress-fill" style={{ width: `${horoscope.luckPercentage}%`, background: '#F59E0B' }} />
          </div>
        </div>

        <div className="astro-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366F1' }}>
            <Sparkles size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">№ {horoscope.luckyNumber}</span>
            <span className="metric-title">Число удачи</span>
          </div>
          <span className="metric-sub-note">Счастливый час: {horoscope.luckyTime}</span>
        </div>

        <div className="astro-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
            <Heart size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-value">{horoscope.compatibleSign}</span>
            <span className="metric-title">Знак-союзник</span>
          </div>
          <span className="metric-sub-note">Цвет: {horoscope.luckyColor}</span>
        </div>
      </div>

      {/* Category Tabs: Все сферы / Любовь / Карьера / Здоровье */}
      <div className="forecast-category-tabs">
        <button 
          type="button"
          className={`category-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          <Sparkles size={16} />
          <span>Все сферы жизни</span>
        </button>
        <button 
          type="button"
          className={`category-tab-btn ${activeCategory === 'love' ? 'active' : ''}`}
          onClick={() => setActiveCategory('love')}
        >
          <Heart size={16} />
          <span>Любовь и Отношения</span>
        </button>
        <button 
          type="button"
          className={`category-tab-btn ${activeCategory === 'career' ? 'active' : ''}`}
          onClick={() => setActiveCategory('career')}
        >
          <Briefcase size={16} />
          <span>Карьера и Финансы</span>
        </button>
        <button 
          type="button"
          className={`category-tab-btn ${activeCategory === 'health' ? 'active' : ''}`}
          onClick={() => setActiveCategory('health')}
        >
          <Activity size={16} />
          <span>Здоровье и Тело</span>
        </button>
      </div>

      {/* Detailed Forecast Cards */}
      <div className="forecast-details-grid">
        {(activeCategory === 'all' || activeCategory === 'love') && (
          <div className="forecast-card love-card">
            <div className="forecast-card-header">
              <div className="forecast-card-icon" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#EC4899' }}>
                <Heart size={22} />
              </div>
              <div>
                <h4 className="forecast-card-title">Любовь и Отношения</h4>
                <span className="forecast-card-sub">Чувства, гармония и притяжение</span>
              </div>
            </div>
            <p className="forecast-card-text">{horoscope.loveForecast}</p>
          </div>
        )}

        {(activeCategory === 'all' || activeCategory === 'career') && (
          <div className="forecast-card career-card">
            <div className="forecast-card-header">
              <div className="forecast-card-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
                <Briefcase size={22} />
              </div>
              <div>
                <h4 className="forecast-card-title">Карьера и Финансы</h4>
                <span className="forecast-card-sub">Работа, проекты и денежные потоки</span>
              </div>
            </div>
            <p className="forecast-card-text">{horoscope.careerForecast}</p>
          </div>
        )}

        {(activeCategory === 'all' || activeCategory === 'health') && (
          <div className="forecast-card health-card">
            <div className="forecast-card-header">
              <div className="forecast-card-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                <Activity size={22} />
              </div>
              <div>
                <h4 className="forecast-card-title">Здоровье и Тонус</h4>
                <span className="forecast-card-sub">Энергия, сон и физический баланс</span>
              </div>
            </div>
            <p className="forecast-card-text">{horoscope.healthForecast}</p>
          </div>
        )}

        {activeCategory === 'all' && (
          <div className="forecast-card advice-card">
            <div className="forecast-card-header">
              <div className="forecast-card-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
                <Lightbulb size={22} />
              </div>
              <div>
                <h4 className="forecast-card-title">Мудрый Совет Дня</h4>
                <span className="forecast-card-sub">Фокус внимания от Вселенной</span>
              </div>
            </div>
            <p className="forecast-card-text advice-highlight">«{horoscope.adviceOfTheDay}»</p>
          </div>
        )}
      </div>

      {/* Bottom Planetary Aspect & Actions Bar */}
      <div className="horoscope-bottom-actions-card">
        <div className="bottom-aspect-info">
          <span className="bottom-aspect-lbl">Ключевой транзит дня:</span>
          <span className="bottom-aspect-val">{horoscope.planetaryAspect}</span>
        </div>

        <div className="bottom-buttons-row">
          <button 
            type="button" 
            className="btn-share-horoscope" 
            onClick={handleShare}
            title="Поделиться гороскопом"
          >
            {copiedLink ? <Check size={16} color="#10B981" /> : <Share2 size={16} />}
            <span>{copiedLink ? 'Ссылка скопирована!' : 'Поделиться'}</span>
          </button>

          {onOpenBooking && (
            <button 
              type="button" 
              className="btn-astrologist-cta"
              onClick={() => onOpenBooking('astrology')}
            >
              <Compass size={16} />
              <span>Индивидуальный разбор у Астролога</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
