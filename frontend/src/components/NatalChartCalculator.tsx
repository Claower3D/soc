import React, { useState } from 'react';
import { 
  Sparkles, Compass, Moon, Sun, Flame, Droplets, Wind, Mountain, 
  Calendar, Clock, MapPin
} from 'lucide-react';
import { calculateNatalChart, type NatalChartData } from '../utils/astrologyEngine';
import './NatalChartCalculator.css';

interface NatalChartCalculatorProps {
  onOpenBooking?: (expertType: string) => void;
}

export const NatalChartCalculator: React.FC<NatalChartCalculatorProps> = ({ onOpenBooking }) => {
  const [name, setName] = useState('Путник');
  const [birthDate, setBirthDate] = useState('1995-07-15');
  const [birthTime, setBirthTime] = useState('14:30');
  const [birthCity, setBirthCity] = useState('Москва');
  const [result, setResult] = useState<NatalChartData | null>(null);
  const [activeTab, setActiveTab] = useState<'astrology' | 'humandesign' | 'lunar'>('astrology');

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) return;
    const chart = calculateNatalChart(birthDate, birthTime || '12:00', birthCity || 'Москва');
    setResult(chart);
  };

  return (
    <div className="natal-container">
      {/* Header Banner */}
      <div className="natal-header">
        <div className="natal-header-glow" />
        <div className="natal-header-content">
          <div className="natal-badge">
            <Sparkles size={14} />
            <span>Космический Резонанс • Астрология & Дизайн Человека</span>
          </div>
          <h2 className="natal-title">Натальная Карта и Бодиграф</h2>
          <p className="natal-subtitle">
            Рассчитайте положение планет, асцендент, энергетический тип и центры осознанности по дате, времени и месту вашего рождения.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="natal-form-card">
        <form onSubmit={handleCalculate} className="natal-form-grid">
          <div className="natal-input-group">
            <label>Ваше имя</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Иван"
              className="natal-input"
            />
          </div>

          <div className="natal-input-group">
            <label><Calendar size={13} /> Дата рождения</label>
            <input 
              type="date" 
              value={birthDate} 
              onChange={e => setBirthDate(e.target.value)} 
              required
              className="natal-input"
            />
          </div>

          <div className="natal-input-group">
            <label><Clock size={13} /> Время рождения</label>
            <input 
              type="time" 
              value={birthTime} 
              onChange={e => setBirthTime(e.target.value)} 
              className="natal-input"
            />
          </div>

          <div className="natal-input-group">
            <label><MapPin size={13} /> Город рождения</label>
            <input 
              type="text" 
              value={birthCity} 
              onChange={e => setBirthCity(e.target.value)} 
              placeholder="Москва, Киев, Алматы..."
              className="natal-input"
            />
          </div>

          <div className="natal-submit-wrapper">
            <button type="submit" className="natal-submit-btn">
              <Sparkles size={16} />
              <span>Рассчитать карту</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <div className="natal-results">
          {/* Sub Navigation */}
          <div className="natal-nav-tabs">
            <button 
              className={`natal-nav-tab ${activeTab === 'astrology' ? 'active' : ''}`}
              onClick={() => setActiveTab('astrology')}
            >
              <Compass size={16} />
              <span>Натальная Карта & Стихии</span>
            </button>
            <button 
              className={`natal-nav-tab ${activeTab === 'humandesign' ? 'active' : ''}`}
              onClick={() => setActiveTab('humandesign')}
            >
              <Sparkles size={16} />
              <span>Дизайн Человека (Бодиграф)</span>
            </button>
            <button 
              className={`natal-nav-tab ${activeTab === 'lunar' ? 'active' : ''}`}
              onClick={() => setActiveTab('lunar')}
            >
              <Moon size={16} />
              <span>Лунный Цикл & Вектор</span>
            </button>
          </div>

          {/* Tab 1: Astrology & Elements */}
          {activeTab === 'astrology' && (
            <div className="natal-tab-content">
              {/* Big Trio Cards: Sun, Moon, Ascendant */}
              <div className="natal-trio-grid">
                {/* Sun */}
                <div className="natal-trio-card sun-card">
                  <div className="trio-icon-wrap">
                    <Sun size={28} className="trio-icon sun-glow" />
                  </div>
                  <div className="trio-tag">Солнечный Знак • Эго & Суть</div>
                  <h3 className="trio-title">{result.sunSign}</h3>
                  <div className="trio-meta">Ведущая стихия: {result.elementDominant}</div>
                  <p className="trio-desc">
                    Ядро личности, источник жизненной витальности и творческого проявления в мире.
                  </p>
                </div>

                {/* Moon */}
                <div className="natal-trio-card moon-card">
                  <div className="trio-icon-wrap">
                    <Moon size={28} className="trio-icon moon-glow" />
                  </div>
                  <div className="trio-tag">Лунный Знак • Подсознание & Душа</div>
                  <h3 className="trio-title">{result.moonSign}</h3>
                  <div className="trio-meta">Внутренний мир и эмоциональные фильтры</div>
                  <p className="trio-desc">
                    Глубинная интуиция, потребности души в безопасности, расслаблении и покое.
                  </p>
                </div>

                {/* Ascendant */}
                <div className="natal-trio-card asc-card">
                  <div className="trio-icon-wrap">
                    <Compass size={28} className="trio-icon asc-glow" />
                  </div>
                  <div className="trio-tag">Асцендент • Социальный Лик</div>
                  <h3 className="trio-title">{result.ascendant}</h3>
                  <div className="trio-meta">Точка восхода на восточном горизонте</div>
                  <p className="trio-desc">
                    То, каким вас впервые видят другие люди и как вы начинаете любые новые начинания.
                  </p>
                </div>
              </div>

              {/* Four Elements Balance */}
              <div className="natal-section-card">
                <h4 className="section-title">
                  <span>Баланс 4-х Первостихий</span>
                  <span className="section-sub">Доминирующая стихия в карте: {result.elementDominant}</span>
                </h4>
                <div className="elements-balance-grid">
                  <div className="element-meter">
                    <div className="element-meter-header">
                      <span className="element-label fire"><Flame size={14} /> Огонь (Воля, драйв)</span>
                      <span className="element-pct">{result.elementBalance.fire}%</span>
                    </div>
                    <div className="element-bar-bg">
                      <div className="element-bar-fill fire" style={{ width: `${result.elementBalance.fire}%` }} />
                    </div>
                  </div>

                  <div className="element-meter">
                    <div className="element-meter-header">
                      <span className="element-label water"><Droplets size={14} /> Вода (Интуиция, чувства)</span>
                      <span className="element-pct">{result.elementBalance.water}%</span>
                    </div>
                    <div className="element-bar-bg">
                      <div className="element-bar-fill water" style={{ width: `${result.elementBalance.water}%` }} />
                    </div>
                  </div>

                  <div className="element-meter">
                    <div className="element-meter-header">
                      <span className="element-label air"><Wind size={14} /> Воздух (Мышление, связь)</span>
                      <span className="element-pct">{result.elementBalance.air}%</span>
                    </div>
                    <div className="element-bar-bg">
                      <div className="element-bar-fill air" style={{ width: `${result.elementBalance.air}%` }} />
                    </div>
                  </div>

                  <div className="element-meter">
                    <div className="element-meter-header">
                      <span className="element-label earth"><Mountain size={14} /> Земля (Опора, материя)</span>
                      <span className="element-pct">{result.elementBalance.earth}%</span>
                    </div>
                    <div className="element-bar-bg">
                      <div className="element-bar-fill earth" style={{ width: `${result.elementBalance.earth}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expert CTA */}
              <div className="natal-expert-banner">
                <div className="expert-banner-info">
                  <h4>Желаете полный натальный разбор 1-на-1?</h4>
                  <p>Профессиональный астролог разберет дома планет, кармические узлы Раху/Кету и периоды жизни.</p>
                </div>
                {onOpenBooking && (
                  <button 
                    className="expert-cta-btn"
                    onClick={() => onOpenBooking('astrologer')}
                  >
                    Записаться к астрологу
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Human Design */}
          {activeTab === 'humandesign' && (
            <div className="natal-tab-content">
              {/* HD Overview Header */}
              <div className="hd-overview-card">
                <div className="hd-main-pill">
                  <div className="hd-type-badge">{result.humanDesign.type}</div>
                  <div className="hd-profile-badge">Профиль: {result.humanDesign.profile}</div>
                </div>

                <div className="hd-details-grid">
                  <div className="hd-detail-box">
                    <span className="hd-box-lbl">Стратегия жизни</span>
                    <strong className="hd-box-val">{result.humanDesign.strategy}</strong>
                  </div>
                  <div className="hd-detail-box">
                    <span className="hd-box-lbl">Внутренний авторитет</span>
                    <strong className="hd-box-val">{result.humanDesign.authority}</strong>
                  </div>
                </div>
              </div>

              {/* Centers */}
              <div className="natal-section-card">
                <h4 className="section-title">
                  <span>Центры Бодиграфа</span>
                  <span className="section-sub">Определенные центры дают постоянную энергию, открытые — мудрость мира</span>
                </h4>

                <div className="hd-centers-grid">
                  {result.humanDesign.definedCenters.map((centerName: string, idx: number) => (
                    <div key={idx} className="hd-center-item defined">
                      <div className="center-item-status">
                        <span className="status-badge defined">Определен</span>
                      </div>
                      <h5 className="center-item-name">{centerName}</h5>
                      <p className="center-item-theme">Стабильный неиссякаемый источник энергии</p>
                    </div>
                  ))}
                  {result.humanDesign.openCenters.map((centerName: string, idx: number) => (
                    <div key={idx} className="hd-center-item open">
                      <div className="center-item-status">
                        <span className="status-badge open">Открыт</span>
                      </div>
                      <h5 className="center-item-name">{centerName}</h5>
                      <p className="center-item-theme">Точка гибкости, восприятия и глубокой мудрости</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expert CTA */}
              <div className="natal-expert-banner">
                <div className="expert-banner-info">
                  <h4>Глубокое чтение вашего Бодиграфа</h4>
                  <p>Сертифицированный аналитик Human Design объяснит ваши каналы, ворота и инкарнационный крест на консультации.</p>
                </div>
                {onOpenBooking && (
                  <button 
                    className="expert-cta-btn"
                    onClick={() => onOpenBooking('humandesign')}
                  >
                    Консультация HD-гида
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Lunar Cycle & Destiny Vector */}
          {activeTab === 'lunar' && (
            <div className="natal-tab-content">
              <div className="lunar-card">
                <div className="lunar-visual">
                  <Moon size={48} className="lunar-big-icon" />
                  <div className="lunar-phase-badge">{result.lunarPhase.name}</div>
                  <div className="lunar-day-num">Освещенность: {result.lunarPhase.illumination}</div>
                </div>
                <div className="lunar-info">
                  <h4 className="lunar-energy-title">Космический вектор предназначения</h4>
                  <p className="lunar-energy-desc">{result.destinyVector}</p>
                  <div className="lunar-advice-box">
                    <strong>Рекомендация для духовных практик:</strong>
                    <p>{result.lunarPhase.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
