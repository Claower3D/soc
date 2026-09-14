import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, Bell, 
  Utensils, CheckCircle2, ChevronRight, Sparkles 
} from 'lucide-react';
import { 
  SPIRITUAL_HOLIDAYS, 
  TRADITIONS_LIST, 
  type SpiritualHoliday 
} from '../data/holidayData';
import './SpiritualCalendar.css';

export const SpiritualCalendar: React.FC = () => {
  const [selectedTradition, setSelectedTradition] = useState<string>('Все традиции');
  const [filterType, setFilterType] = useState<'all' | 'fast' | 'festival'>('all');
  const [activeHoliday, setActiveHoliday] = useState<SpiritualHoliday | null>(null);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  const filteredHolidays = SPIRITUAL_HOLIDAYS.filter((item: SpiritualHoliday) => {
    const matchTradition = selectedTradition === 'Все традиции' || item.tradition === selectedTradition;
    const isFast = item.badge === 'Пост';
    const matchType = filterType === 'all' || 
      (filterType === 'fast' && isFast) || 
      (filterType === 'festival' && !isFast);
    return matchTradition && matchType;
  });

  const toggleReminder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReminders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="cal-container">
      {/* Header Banner */}
      <div className="cal-header">
        <div className="cal-badge">
          <CalendarIcon size={14} />
          <span>Священный Цикл • 12 Духовных Традиций</span>
        </div>
        <h2 className="cal-title">Единый Духовный Календарь</h2>
        <p className="cal-subtitle">
          Праздники, священные посты, дни силы и практики мировых традиций: Христианство, Ислам, Буддизм, Иудаизм, Индуизм, Веды и Славянский путь.
        </p>

        {/* Quick Filter by Type */}
        <div className="cal-type-filters">
          <button 
            className={`cal-type-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Все события ({SPIRITUAL_HOLIDAYS.length})
          </button>
          <button 
            className={`cal-type-btn ${filterType === 'fast' ? 'active' : ''}`}
            onClick={() => setFilterType('fast')}
          >
            <Utensils size={14} />
            Посты и очищение
          </button>
          <button 
            className={`cal-type-btn ${filterType === 'festival' ? 'active' : ''}`}
            onClick={() => setFilterType('festival')}
          >
            <Sparkles size={14} />
            Светлые праздники и дни силы
          </button>
        </div>
      </div>

      {/* Traditions Scroll Bar */}
      <div className="cal-traditions-bar">
        {TRADITIONS_LIST.map((trad: string) => (
          <button 
            key={trad}
            className={`cal-tradition-chip ${selectedTradition === trad ? 'active' : ''}`}
            onClick={() => setSelectedTradition(trad)}
          >
            {trad}
          </button>
        ))}
      </div>

      {/* Grid of Events */}
      <div className="cal-grid">
        {filteredHolidays.map((item: SpiritualHoliday) => {
          const isReminded = reminders[item.id];
          const isFast = item.badge === 'Пост';
          return (
            <div 
              key={item.id} 
              className={`cal-card ${isFast ? 'is-fast' : 'is-festival'}`}
              onClick={() => setActiveHoliday(item)}
            >
              <div className="cal-card-top">
                <span className="cal-card-date">{item.dateStr}</span>
                <span className="cal-card-tradition">{item.tradition}</span>
              </div>

              <h4 className="cal-card-title">{item.title}</h4>
              <p className="cal-card-desc">{item.description}</p>

              <div className="cal-card-tags">
                {isFast && (
                  <span className="cal-tag fast-tag">
                    <Utensils size={12} /> Пост / Воздержание
                  </span>
                )}
                <span className="cal-tag practice-tag">
                  <Sparkles size={12} /> {item.practice}
                </span>
              </div>

              <div className="cal-card-actions">
                <button 
                  className={`cal-remind-btn ${isReminded ? 'reminded' : ''}`}
                  onClick={(e) => toggleReminder(item.id, e)}
                  title="Напомнить в уведомлениях"
                >
                  <Bell size={14} />
                  <span>{isReminded ? 'В календаре' : 'Напомнить'}</span>
                </button>
                <span className="cal-card-more">
                  Подробнее <ChevronRight size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Modal for Active Holiday */}
      {activeHoliday && (
        <div className="cal-modal-overlay" onClick={() => setActiveHoliday(null)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <div className="cal-modal-header">
              <div className="cal-modal-top-info">
                <span className="cal-modal-tradition">{activeHoliday.tradition}</span>
                <span className="cal-modal-date">{activeHoliday.dateStr}</span>
              </div>
              <h3 className="cal-modal-title">{activeHoliday.title}</h3>
              <p className="cal-modal-desc">{activeHoliday.description}</p>
            </div>

            <div className="cal-modal-body">
              {/* Meaning */}
              <div className="cal-modal-section quote-section">
                <h4 className="cal-sec-title">
                  <Sparkles size={16} /> Духовный смысл дня
                </h4>
                <p className="cal-quote-text">{activeHoliday.meaning}</p>
              </div>

              {/* Rules / Practices */}
              {activeHoliday.rules && activeHoliday.rules.length > 0 && (
                <div className="cal-modal-section fast-section">
                  <h4 className="cal-sec-title">
                    <Utensils size={16} /> Традиционные правила и предписания
                  </h4>
                  <ul className="cal-practices-list">
                    {activeHoliday.rules.map((rule: string, idx: number) => (
                      <li key={idx}>
                        <CheckCircle2 size={16} className="check-icon" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Practice */}
              <div className="cal-modal-section">
                <h4 className="cal-sec-title">
                  <Sparkles size={16} /> Рекомендуемая личная практика
                </h4>
                <p style={{ color: 'var(--text-primary, #ffffff)', fontSize: '0.88rem' }}>
                  {activeHoliday.practice}
                </p>
              </div>
            </div>

            <div className="cal-modal-footer">
              <button 
                className={`cal-modal-bell-btn ${reminders[activeHoliday.id] ? 'active' : ''}`}
                onClick={(e) => toggleReminder(activeHoliday.id, e)}
              >
                <Bell size={16} />
                <span>
                  {reminders[activeHoliday.id] ? 'Уведомление запланировано' : 'Добавить напоминание'}
                </span>
              </button>
              <button 
                className="cal-modal-close-btn"
                onClick={() => setActiveHoliday(null)}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
