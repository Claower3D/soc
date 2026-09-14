import React from 'react';
import { Award, Flame, Star, Compass } from 'lucide-react';
import './KarmaTreeWidget.css';

interface KarmaTreeWidgetProps {
  xp: number;
  level: number;
  streakDays: number;
  onOpenTasks?: () => void;
}

export const KarmaTreeWidget: React.FC<KarmaTreeWidgetProps> = ({
  xp,
  level,
  streakDays
}) => {
  const getStageTitle = (lvl: number) => {
    if (lvl <= 1) return { title: 'Семя Намерения', icon: '🌱', desc: 'Первые шаги к внутренней ясности' };
    if (lvl === 2) return { title: 'Зеленый Росток', icon: '🌿', desc: 'Ежедневная осознанность пускает корни' };
    if (lvl === 3) return { title: 'Священный Лотос', icon: '🪷', desc: 'Цветок раскрывается сквозь суету ума' };
    if (lvl === 4) return { title: 'Древо Бодхи', icon: '🌳', desc: 'Глубокая мудрость и несокрушимый покой' };
    return { title: 'Космическое Сияние', icon: '✨', desc: 'Единство со всеми живыми существами' };
  };

  const stage = getStageTitle(level);
  const currentLevelProgress = xp % 100;
  const progressPct = Math.min(100, Math.floor((currentLevelProgress / 100) * 100));

  return (
    <div className="karma-tree-card">
      <div className="karma-tree-top">
        <div className="karma-stage-icon-wrap">
          <span className="karma-emoji-big">{stage.icon}</span>
        </div>

        <div className="karma-info-col">
          <div className="karma-badge-row">
            <span className="karma-lvl-pill">Уровень {level}</span>
            <span className="karma-streak-pill">
              <Flame size={12} className="flame-icon" /> {streakDays} дней подряд
            </span>
          </div>

          <h3 className="karma-stage-name">{stage.title}</h3>
          <p className="karma-stage-desc">{stage.desc}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="karma-xp-section">
        <div className="karma-xp-header">
          <span className="xp-label">Опыт осознанности (Карма XP)</span>
          <span className="xp-val">{currentLevelProgress} / 100 XP</span>
        </div>

        <div className="karma-progress-bg">
          <div className="karma-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Badges / Micro Achievements */}
      <div className="karma-badges-row">
        <div className="micro-badge earned" title="Завершено 5 медитаций">
          <Star size={12} />
          <span>Первый покой</span>
        </div>
        <div className="micro-badge earned" title="Использован ИИ-наставник">
          <Compass size={12} />
          <span>Поиск пути</span>
        </div>
        <div className="micro-badge locked" title="30 дней осознанности">
          <Award size={12} />
          <span>Мастер Дзэн</span>
        </div>
      </div>
    </div>
  );
};
