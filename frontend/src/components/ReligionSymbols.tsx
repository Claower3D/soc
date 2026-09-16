import React from 'react';

interface ReligionSymbolProps {
  id: string;
  size?: number;
  className?: string;
}

export const ReligionSymbol: React.FC<ReligionSymbolProps> = ({ id, size = 32, className = '' }) => {
  const s = size;

  switch (id) {
    case 'christianity':
      // Крест с сиянием и золотым градиентом
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_christianity)" />
          <defs>
            <linearGradient id="bg_christianity" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E1B4B" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="gold_cross" x1="18" y1="6" x2="18" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#EAB308" />
              <stop offset="1" stopColor="#CA8A04" />
            </linearGradient>
            <filter id="glow_cross" x="0" y="0" width="36" height="36" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#glow_cross)">
            {/* Вертикальная перекладина */}
            <path d="M16 6.5C16 5.67 16.67 5 17.5 5H18.5C19.33 5 20 5.67 20 6.5V29.5C20 30.33 19.33 31 18.5 31H17.5C16.67 31 16 30.33 16 29.5V6.5Z" fill="url(#gold_cross)" />
            {/* Горизонтальная перекладина */}
            <path d="M8.5 12C7.67 12 7 12.67 7 13.5V14.5C7 15.33 7.67 16 8.5 16H27.5C28.33 16 29 15.33 29 14.5V13.5C29 12.67 28.33 12 27.5 12H8.5Z" fill="url(#gold_cross)" />
          </g>
          {/* Центр сияния */}
          <circle cx="18" cy="14" r="2" fill="#FFFFFF" opacity="0.8" />
        </svg>
      );

    case 'islam':
      // Полумесяц и 5-конечная звезда
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_islam)" />
          <defs>
            <linearGradient id="bg_islam" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#064E3B" />
              <stop offset="1" stopColor="#022C22" />
            </linearGradient>
            <linearGradient id="gold_islam" x1="10" y1="8" x2="26" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#EAB308" />
            </linearGradient>
          </defs>
          {/* Полумесяц */}
          <path d="M18.8 9.5C14.5 9.5 11 13.1 11 17.5C11 21.9 14.5 25.5 18.8 25.5C20.6 25.5 22.2 24.8 23.5 23.8C20 24.5 16.5 22.2 16.5 17.5C16.5 12.8 20 10.5 23.5 11.2C22.2 10.2 20.6 9.5 18.8 9.5Z" fill="url(#gold_islam)" />
          {/* Звезда */}
          <polygon points="23,14 24.2,16.5 27,16.8 24.9,18.7 25.5,21.4 23,20 20.5,21.4 21.1,18.7 19,16.8 21.8,16.5" fill="url(#gold_islam)" />
        </svg>
      );

    case 'judaism':
      // Звезда Давида (Маген Давид)
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_judaism)" />
          <defs>
            <linearGradient id="bg_judaism" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E3A8A" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="gold_david" x1="10" y1="7" x2="26" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#93C5FD" />
              <stop offset="0.5" stopColor="#60A5FA" />
              <stop offset="1" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          {/* Верхний треугольник */}
          <polygon points="18,7 28,24 8,24" stroke="#FDE047" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
          {/* Нижний треугольник */}
          <polygon points="18,29 28,12 8,12" stroke="#FDE047" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
          <circle cx="18" cy="18" r="1.5" fill="#FDE047" />
        </svg>
      );

    case 'hinduism':
      // Сакральный символ Ом (Аум)
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_hinduism)" />
          <defs>
            <linearGradient id="bg_hinduism" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C2D12" />
              <stop offset="1" stopColor="#431407" />
            </linearGradient>
            <linearGradient id="gold_om" x1="8" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.7" stopColor="#F97316" />
            </linearGradient>
          </defs>
          <path d="M12.5 13.5C11.5 13.5 10.5 14.5 10.5 16C10.5 17.5 11.5 19 13.5 19C11 19.5 9.5 21.5 9.5 23.5C9.5 26 12 28 15 28C18.5 28 20.5 25.5 20.5 23.5V21.5C21.5 23 23.5 24 25.5 24C28 24 29 22 29 20C29 17 26.5 16 24 16C23 16 22 16.3 21 17C21 14.5 19 12 16.5 12C14.5 12 13 12.8 12.5 13.5ZM21 11C23 11 25.5 11.8 26.5 13C25 12.8 23 13 22 13.5C21.2 12.5 21 11.5 21 11ZM24 8.5C24.8 8.5 25.5 9.2 25.5 10C25.5 10.8 24.8 11.5 24 11.5C23.2 11.5 22.5 10.8 22.5 10C22.5 9.2 23.2 8.5 24 8.5Z" fill="url(#gold_om)" />
        </svg>
      );

    case 'buddhism':
      // Колесо Дхармы (Дхармачакра)
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_buddhism)" />
          <defs>
            <linearGradient id="bg_buddhism" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#78350F" />
              <stop offset="1" stopColor="#292524" />
            </linearGradient>
            <linearGradient id="gold_wheel" x1="8" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
          {/* Внешний обод */}
          <circle cx="18" cy="18" r="10" stroke="url(#gold_wheel)" strokeWidth="2.2" fill="none" />
          {/* Внутренний обод */}
          <circle cx="18" cy="18" r="3.5" stroke="url(#gold_wheel)" strokeWidth="1.5" fill="none" />
          <circle cx="18" cy="18" r="1.5" fill="#FDE047" />
          {/* 8 спиц */}
          <line x1="18" y1="8" x2="18" y2="28" stroke="url(#gold_wheel)" strokeWidth="1.8" />
          <line x1="8" y1="18" x2="28" y2="18" stroke="url(#gold_wheel)" strokeWidth="1.8" />
          <line x1="10.9" y1="10.9" x2="25.1" y2="25.1" stroke="url(#gold_wheel)" strokeWidth="1.8" />
          <line x1="25.1" y1="10.9" x2="10.9" y2="25.1" stroke="url(#gold_wheel)" strokeWidth="1.8" />
        </svg>
      );

    case 'taoism':
      // Инь-Ян
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_taoism)" />
          <defs>
            <linearGradient id="bg_taoism" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E293B" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>
          </defs>
          <circle cx="18" cy="18" r="11" fill="#FFFFFF" />
          {/* Черная половина Инь */}
          <path d="M18 7C24.075 7 29 11.925 29 18C29 24.075 24.075 29 18 29C18 29 18 23.5 18 23.5C18 20.462 20.462 18 23.5 18C20.462 18 18 15.538 18 12.5C18 12.5 18 7 18 7Z" fill="#1E293B" />
          <path d="M18 7C11.925 7 7 11.925 7 18C7 24.075 11.925 29 18 29C18 23.5 18 23.5 18 23.5C15 23.5 12.5 21 12.5 18C12.5 15 15 12.5 18 12.5C18 12.5 18 7 18 7Z" fill="#1E293B" />
          <circle cx="18" cy="12.5" r="2.2" fill="#FFFFFF" />
          <circle cx="18" cy="23.5" r="2.2" fill="#1E293B" />
          <circle cx="18" cy="18" r="11" stroke="#EAB308" strokeWidth="1.5" fill="none" />
        </svg>
      );

    case 'shinto':
      // Священные ворота Тории
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_shinto)" />
          <defs>
            <linearGradient id="bg_shinto" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#881337" />
              <stop offset="1" stopColor="#4C0519" />
            </linearGradient>
            <linearGradient id="gold_torii" x1="6" y1="6" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          {/* Верхняя изогнутая крыша Касаги */}
          <path d="M6 10.5C11 8.8 25 8.8 30 10.5L29.5 12.5C24.5 11 11.5 11 6.5 12.5L6 10.5Z" fill="url(#gold_torii)" />
          {/* Вторая поперечина Симаки */}
          <rect x="8" y="14" width="20" height="2.2" rx="0.8" fill="url(#gold_torii)" />
          {/* Две вертикальные колонны Хасира */}
          <rect x="11.5" y="12" width="2.5" height="17" rx="0.8" fill="url(#gold_torii)" />
          <rect x="22" y="12" width="2.5" height="17" rx="0.8" fill="url(#gold_torii)" />
          {/* Центральный фиксатор Гакудзука */}
          <rect x="17.2" y="10.5" width="1.6" height="4" fill="url(#gold_torii)" />
        </svg>
      );

    case 'jainism':
      // Ладонь Ахимса (ненасилие) с Колесом
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_jainism)" />
          <defs>
            <linearGradient id="bg_jainism" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#042F2E" />
              <stop offset="1" stopColor="#022C22" />
            </linearGradient>
            <linearGradient id="gold_ahimsa" x1="10" y1="6" x2="26" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#EAB308" />
            </linearGradient>
          </defs>
          {/* Ладонь */}
          <path d="M14 6C13.4 6 13 6.4 13 7V16H12V9C12 8.4 11.6 8 11 8C10.4 8 10 8.4 10 9V17H9.5V11C9.5 10.4 9.1 10 8.5 10C7.9 10 7.5 10.4 7.5 11V19C7.5 24 11 28 17 28C23 28 26 24 26 19V14C26 13.4 25.6 13 25 13C24.4 13 24 13.4 24 14V17H23V8C23 7.4 22.6 7 22 7C21.4 7 21 7.4 21 8V16H20V7C20 6.4 19.6 6 19 6C18.4 6 18 6.4 18 7V16H17V6C17 5.4 16.6 5 16 5C15.4 5 15 5.4 15 6V16H14V6Z" fill="url(#gold_ahimsa)" />
          {/* Колесо в центре ладони */}
          <circle cx="17" cy="20" r="3.2" stroke="#042F2E" strokeWidth="1.2" fill="#FFFFFF" />
          <circle cx="17" cy="20" r="1.2" fill="#042F2E" />
        </svg>
      );

    case 'sikhism':
      // Кханда (обоюдоострый меч, чакра и два кинжала)
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_sikhism)" />
          <defs>
            <linearGradient id="bg_sikhism" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E1B4B" />
              <stop offset="1" stopColor="#312E81" />
            </linearGradient>
            <linearGradient id="gold_khanda" x1="8" y1="6" x2="28" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          {/* Центральный меч Кханда */}
          <line x1="18" y1="5" x2="18" y2="31" stroke="url(#gold_khanda)" strokeWidth="2.2" strokeLinecap="round" />
          {/* Круглая чакра */}
          <circle cx="18" cy="18" r="6" stroke="url(#gold_khanda)" strokeWidth="2" fill="none" />
          {/* Левый изогнутый клинок (Мири) */}
          <path d="M12 9C9 13 9 22 13.5 27" stroke="url(#gold_khanda)" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Правый изогнутый клинок (Пири) */}
          <path d="M24 9C27 13 27 22 22.5 27" stroke="url(#gold_khanda)" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'zoroastrianism':
      // Фаравахар (Крылатый дух мудрости)
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_zoro)" />
          <defs>
            <linearGradient id="bg_zoro" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#451A03" />
              <stop offset="1" stopColor="#1C1917" />
            </linearGradient>
            <linearGradient id="gold_zoro" x1="6" y1="10" x2="30" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
          {/* Фигура человека в центре */}
          <circle cx="18" cy="12" r="2.2" fill="url(#gold_zoro)" />
          <circle cx="18" cy="19" r="3.2" stroke="url(#gold_zoro)" strokeWidth="1.5" fill="none" />
          {/* Левое крыло */}
          <path d="M15 17C11 16 7 15 5 13C6 17 10 20 15 20V17Z" fill="url(#gold_zoro)" />
          {/* Правое крыло */}
          <path d="M21 17C25 16 29 15 31 13C30 17 26 20 21 20V17Z" fill="url(#gold_zoro)" />
          {/* Хвост */}
          <polygon points="16,23 20,23 21,28 15,28" fill="url(#gold_zoro)" />
        </svg>
      );

    case 'ayyavazhi':
      // Нама и лотос (Победа света)
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_ayva)" />
          <defs>
            <linearGradient id="bg_ayva" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#581C87" />
              <stop offset="1" stopColor="#3B0764" />
            </linearGradient>
            <linearGradient id="gold_ayva" x1="8" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="1" stopColor="#A855F7" />
            </linearGradient>
          </defs>
          {/* Лотос основание */}
          <path d="M10 26C13 22 23 22 26 26H10Z" fill="url(#gold_ayva)" />
          {/* Пламя Нама */}
          <path d="M18 7C18 7 14 14 14 18C14 20.2 15.8 22 18 22C20.2 22 22 20.2 22 18C22 14 18 7 18 7Z" fill="url(#gold_ayva)" />
          <circle cx="18" cy="18" r="1.8" fill="#FFFFFF" />
        </svg>
      );

    case 'humanism':
      // Счастливый человек (Happy Human)
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_humanism)" />
          <defs>
            <linearGradient id="bg_humanism" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E3A8A" />
              <stop offset="1" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="gold_human" x1="8" y1="6" x2="28" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" />
              <stop offset="1" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          {/* Голова */}
          <circle cx="18" cy="10" r="3.2" fill="url(#gold_human)" />
          {/* Раскрытые руки (дуга созидания) */}
          <path d="M8 15C13 19 23 19 28 15" stroke="url(#gold_human)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Тело человека */}
          <path d="M18 15V28" stroke="url(#gold_human)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Звездочка в руке */}
          <circle cx="28" cy="15" r="1.5" fill="#FDE047" />
          <circle cx="8" cy="15" r="1.5" fill="#FDE047" />
        </svg>
      );

    case 'none':
    default:
      // Скрыто / Личное
      return (
        <svg width={s} height={s} viewBox="0 0 36 36" fill="none" className={className}>
          <rect width="36" height="36" rx="8" fill="url(#bg_none)" />
          <defs>
            <linearGradient id="bg_none" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#334155" />
              <stop offset="1" stopColor="#1E293B" />
            </linearGradient>
          </defs>
          {/* Иконка замка / щита */}
          <path d="M18 10C15.8 10 14 11.8 14 14V17H13C12.4 17 12 17.4 12 18V25C12 25.6 12.4 26 13 26H23C23.6 26 24 25.6 24 25V18C24 17.4 23.6 17 23 17H22V14C22 11.8 20.2 10 18 10ZM16 14C16 12.9 16.9 12 18 12C19.1 12 20 12.9 20 14V17H16V14ZM18 20C18.6 20 19 20.4 19 21C19 21.6 18.6 22 18 22C17.4 22 17 21.6 17 21C17 20.4 17.4 20 18 20Z" fill="#94A3B8" />
        </svg>
      );
  }
};
