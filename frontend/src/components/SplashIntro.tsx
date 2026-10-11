import { useEffect, useMemo, useState } from 'react';
import logoImg from '../assets/logo.png';
import './SplashIntro.css';

const TOPICS = [
  'Астрология', 'Нумерология', 'Таро', 'Human Design', 'Эзотерика',
  'Ченнелинг', 'Тета-хилинг', 'Осознанные сны', 'ВсеЛенская терапия', 'Регресс',
];

// Общая длительность ≈ 12 с: 10.6 с сцены + 1.4 с плавного перехода в приложение
const TOTAL_MS = 10600;
const EXIT_MS = 1400;
const SESSION_KEY = 'newage_splash_shown';

/** Показываем только на мобильных / в Android-приложении, один раз за сессию */
export function shouldShowSplash(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return false;
  } catch { /* ignore */ }
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  return isMobileUA || window.innerWidth <= 768;
}

interface SplashIntroProps {
  onFinish: () => void;
}

export function SplashIntro({ onFinish }: SplashIntroProps) {
  const [leaving, setLeaving] = useState(false);
  const [topicIdx, setTopicIdx] = useState(0);

  const title = 'New Age';
  const stars = useMemo(
    () => Array.from({ length: 46 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.2 + 0.6,
      delay: Math.random() * 3,
      dur: Math.random() * 2.5 + 1.8,
    })),
    []
  );

  const finish = () => {
    if (leaving) return;
    setLeaving(true);
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
    setTimeout(onFinish, EXIT_MS);
  };

  useEffect(() => {
    const t = setTimeout(finish, TOTAL_MS);
    // Направления начинают сменяться после появления основного текста
    let iv: ReturnType<typeof setInterval> | undefined;
    const startTopics = setTimeout(() => {
      iv = setInterval(() => setTopicIdx(i => (i + 1) % TOPICS.length), 640);
    }, 5600);
    return () => {
      clearTimeout(t);
      clearTimeout(startTopics);
      if (iv) clearInterval(iv);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`splash-root ${leaving ? 'leaving' : ''}`} onClick={finish} role="presentation">
      {/* Космический фон */}
      <div className="splash-nebula n1" />
      <div className="splash-nebula n2" />
      <div className="splash-nebula n3" />
      <div className="splash-stars">
        {stars.map(s => (
          <i
            key={s.id}
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          />
        ))}
      </div>

      <div className="splash-center">
        {/* Сакральная геометрия вокруг логотипа */}
        <div className="splash-geometry">
          <svg className="splash-ring r1" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="96" />
          </svg>
          <svg className="splash-ring r2" viewBox="0 0 200 200">
            <polygon points="100,8 180,146 20,146" />
            <polygon points="100,192 20,54 180,54" />
          </svg>
          <svg className="splash-ring r3" viewBox="0 0 200 200">
            {[0, 60, 120, 180, 240, 300].map(a => (
              <circle
                key={a}
                cx={100 + 34 * Math.cos((a * Math.PI) / 180)}
                cy={100 + 34 * Math.sin((a * Math.PI) / 180)}
                r="34"
              />
            ))}
          </svg>
          <div className="splash-glow" />
          <img src={logoImg} alt="New Age" className="splash-logo" />
        </div>

        <div className="splash-greet">Приветствую тебя</div>

        <h1 className="splash-title" aria-label={title}>
          {title.split('').map((ch, i) => (
            <span key={i} style={{ animationDelay: `${3.3 + i * 0.12}s` }}>
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </h1>

        <div className="splash-line" />

        <p className="splash-sub">
          Платформа духовного роста<br />и раскрытия ваших способностей
        </p>

        <div className="splash-topic-wrap">
          <span key={topicIdx} className="splash-topic">✦ {TOPICS[topicIdx]} ✦</span>
        </div>

        <p className="splash-mission">
          Познай свою многомерную природу<br />и высшее предназначение на Земле
        </p>
      </div>

      <div className="splash-progress"><i style={{ animationDuration: `${TOTAL_MS}ms` }} /></div>
      <button
        type="button"
        className="splash-skip"
        onClick={(e) => { e.stopPropagation(); finish(); }}
      >
        Пропустить
      </button>
    </div>
  );
}
