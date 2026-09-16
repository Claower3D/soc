/**
 * Data structures and mock database for New Age Dating & Resonance module
 * Модуль знакомств, поиска партнеров, друзей, единомышленников и односознавцев
 */

export type DatingGoalType = 
  | 'love'        // Любовь и романтические отношения
  | 'family'      // Создание семьи и серьезные отношения
  | 'friends'     // Дружба и общение
  | 'spiritual'   // Односознавцы, однодуховцы, совместные практики
  | 'creativity'  // Совместное творчество и искусство
  | 'travel'      // Путешествия и ретриты
  | 'business';   // Бизнес, стартапы и проекты

export interface DatingGoalInfo {
  id: DatingGoalType;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  badgeClass: string;
  color: string;
}

export const DATING_GOALS: DatingGoalInfo[] = [
  {
    id: 'love',
    label: 'Любовь и романтика',
    shortLabel: 'Любовь',
    icon: '💖',
    description: 'Искренние романтические чувства, свидания и глубокая взаимная привязанность.',
    badgeClass: 'badge-pink',
    color: '#EC4899'
  },
  {
    id: 'family',
    label: 'Создание семьи',
    shortLabel: 'Семья',
    icon: '💍',
    description: 'Серьезные отношения, построение домашнего очага и осознанное партнерство.',
    badgeClass: 'badge-rose',
    color: '#F43F5E'
  },
  {
    id: 'friends',
    label: 'Поиск друзей',
    shortLabel: 'Дружба',
    icon: '🤝',
    description: 'Искренняя дружба, душевные беседы, совместные прогулки и поддержка.',
    badgeClass: 'badge-blue',
    color: '#3B82F6'
  },
  {
    id: 'spiritual',
    label: 'Односознавцы & Духовные практики',
    shortLabel: 'Односознавцы',
    icon: '🧘',
    description: 'Единомышленники по уровню сознания (1-11), медитации, ретриты, познание Дао и сути.',
    badgeClass: 'badge-purple',
    color: '#8B5CF6'
  },
  {
    id: 'creativity',
    label: 'Творчество & Искусство',
    shortLabel: 'Творчество',
    icon: '🎨',
    description: 'Музыкальные джемы, живопись, дизайн, писательство и создание шедевров.',
    badgeClass: 'badge-amber',
    color: '#F59E0B'
  },
  {
    id: 'travel',
    label: 'Путешествия & Экспедиции',
    shortLabel: 'Путешествия',
    icon: '✈️',
    description: 'Поездки по местам силы, горы Алтая, океан, походы и новые города.',
    badgeClass: 'badge-teal',
    color: '#14B8A6'
  },
  {
    id: 'business',
    label: 'Проекты & Партнерство',
    shortLabel: 'Проекты',
    icon: '🚀',
    description: 'Со-основатели, единомышленники для стартапов, инвестиций и созидания.',
    badgeClass: 'badge-emerald',
    color: '#10B981'
  }
];

export interface DatingProfile {
  id: string;
  userId?: string;
  name: string;
  username?: string;
  age: number;
  birthDate?: string;
  gender: 'male' | 'female' | 'other';
  city: string;
  country?: string;
  avatar: string;
  photos: string[];
  goals: DatingGoalType[];
  bio: string;
  occupation: string;
  interests: string[];
  achievements: string[];
  lifeGoals: string[];
  consciousnessLevel: number; // 1-11
  consciousnessTitle: string;
  zodiacSign: string;
  spiritualTradition?: string;
  verified?: boolean;
  online?: boolean;
  lastActive?: string;
  compatibilityScore?: number; // 0-100%
  distanceKm?: number; // Расстояние в километрах (по близости)
  lookingFor?: {
    gender?: 'all' | 'male' | 'female';
    ageMin?: number;
    ageMax?: number;
    goals?: DatingGoalType[];
    city?: string;
    country?: string;
  };
}

export const INITIAL_DATING_PROFILES: DatingProfile[] = [
  {
    id: 'dp-1',
    name: 'Елена Воронова',
    username: 'elena_zen',
    age: 26,
    birthDate: '1999-06-18',
    gender: 'female',
    city: 'Москва',
    country: 'Россия',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'
    ],
    goals: ['love', 'spiritual', 'travel'],
    bio: 'Практикую випассану и йогу более 5 лет. Преподаю звукотерапию поющими чашами 432 Гц. Ищу близкого по духу человека для гармоничных отношений, совместных путешествий по местам силы и созидания семейного тепла.',
    occupation: 'Инструктор саундхилинга & Архитектор пространств',
    interests: ['Медитация', 'Хатха-йога', 'Амбиент-музыка', 'Горы Алтая', 'Психология', 'Чайные церемонии'],
    achievements: [
      'Открыла собственную студию медитации в центре столицы',
      'Прошла 21-дневный ретрит молчания в Непале',
      'Защитила диплом магистра по экологичной архитектуре'
    ],
    lifeGoals: [
      'Создать гармоничный семейный союз, основанный на доверии и безусловной любви',
      'Организовать выездной ретритный центр на озере Байкал',
      'Освоить игру на индийском ситаре'
    ],
    consciousnessLevel: 7,
    consciousnessTitle: 'Класс 7 • Проницательный Аналитик & Наставник',
    zodiacSign: 'Близнецы',
    spiritualTradition: 'Буддизм & Даосизм',
    verified: true,
    online: true,
    compatibilityScore: 94,
    distanceKm: 3
  },
  {
    id: 'dp-2',
    name: 'Алексей Миронов',
    username: 'alex_flow',
    age: 29,
    birthDate: '1996-10-12',
    gender: 'male',
    city: 'Санкт-Петербург',
    country: 'Россия',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80'
    ],
    goals: ['love', 'friends', 'business'],
    bio: 'Основатель EdTech платформы нового поколения. Ценю честность, живой юмор, спорт и интеллектуальные беседы. Верю, что двое должны вдохновлять друг друга на полет, а не связывать крылья.',
    occupation: 'Tech-предприниматель & Сноубордист',
    interests: ['Искусственный Интеллект', 'Сноуборд', 'Книги по философии', 'Кофеенный крафт', 'Бег на рассвете'],
    achievements: [
      'Построил компанию с аудиторией более 100 000 пользователей',
      'Пробежал марафон 42.2 км в Париже',
      'Обучил более 50 начинающих разработчиков'
    ],
    lifeGoals: [
      'Встретить вдохновляющую спутницу жизни для глубокой и честной любви',
      'Запустить благотворительный фонд технологического образования',
      'Построить уютный деревянный дом с панорамными окнами на берегу залива'
    ],
    consciousnessLevel: 8,
    consciousnessTitle: 'Класс 8 • Системный Мыслитель & Стратег',
    zodiacSign: 'Весы',
    spiritualTradition: 'Гуманизм & Стоицизм',
    verified: true,
    online: true,
    compatibilityScore: 91,
    distanceKm: 12
  },
  {
    id: 'dp-3',
    name: 'Мария Радовская',
    username: 'maria_sun',
    age: 24,
    birthDate: '2001-08-04',
    gender: 'female',
    city: 'Сочи',
    country: 'Россия',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80'
    ],
    goals: ['spiritual', 'friends', 'creativity'],
    bio: 'Художница, астролог и практик осознанности. Обожаю морские закаты, сапсерфинг и создание мандал из натуральных минералов. Ищу единомышленников и односознавцев для совместных выездов в Красную Поляну и глубоких бесед.',
    occupation: 'Художник-визионер & Астропсихолог',
    interests: ['Астрология', 'Живопись маслом', 'Сап-серфинг', 'Эко-образ жизни', 'Мандалы'],
    achievements: [
      'Персональная выставка картин в галерее современного искусства',
      'Создала авторскую колоду метафорических карт',
      'Провела более 300 астро-консультаций'
    ],
    lifeGoals: [
      'Создать арт-резиденцию для творческих людей на море',
      'Найти верных друзей близкого духовного резонанса',
      'Издать иллюстрированную книгу о созвездиях и внутреннем свете'
    ],
    consciousnessLevel: 6,
    consciousnessTitle: 'Класс 6 • Интуитивный Наблюдатель',
    zodiacSign: 'Лев',
    spiritualTradition: 'Ведическая мудрость',
    verified: true,
    online: false,
    lastActive: '15 минут назад',
    compatibilityScore: 88,
    distanceKm: 8
  },
  {
    id: 'dp-4',
    name: 'Дмитрий Светлов',
    username: 'dmitry_zen',
    age: 33,
    birthDate: '1992-03-27',
    gender: 'male',
    city: 'Екатеринбург',
    country: 'Россия',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80'
    ],
    goals: ['family', 'love', 'spiritual'],
    bio: 'Хирург восстановительной медицины и мастер цигун. Люблю природу Урала, походы, классическую музыку и тишину. Мечтаю о крепкой семье, где царит взаимное уважение, искренность и тепло.',
    occupation: 'Врач восстановительной медицины & Мастер Цигун',
    interests: ['Цигун', 'Медицинские исследования', 'Классическая музыка', 'Треккинг', 'Тайцзицюань'],
    achievements: [
      'Спас и вернул к полноценной жизни более 400 пациентов',
      'Инструктор по стилю Чэнь цигун (10 лет практики)',
      'Поднялся на высшую точку Уральских гор — гору Народная'
    ],
    lifeGoals: [
      'Создать счастливую любящую семью с осознанной женщиной',
      'Открыть клинику интегративной медицины для реабилитации',
      'Посадить кедровый лес'
    ],
    consciousnessLevel: 9,
    consciousnessTitle: 'Класс 9 • Интегратор Реальности & Целитель',
    zodiacSign: 'Овен',
    spiritualTradition: 'Даосизм & Христианство',
    verified: true,
    online: true,
    compatibilityScore: 96,
    distanceKm: 45
  },
  {
    id: 'dp-5',
    name: 'Анна Берг',
    username: 'anna_berg',
    age: 27,
    birthDate: '1998-11-20',
    gender: 'female',
    city: 'Казань',
    country: 'Россия',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ],
    goals: ['friends', 'creativity', 'business'],
    bio: 'Product Designer в FinTech и независимый фотограф дикой природы. Люблю урбанистику, современную архитектуру, джаз и поездки на выходные в незнакомые города. Открыта к знакомствам с умными, творческими людьми.',
    occupation: 'Lead UI/UX Designer & Документальный фотограф',
    interests: ['Дизайн интерфейсов', 'Пленочная фотография', 'Джаз', 'Архитектура', 'Велосипедные прогулки'],
    achievements: [
      'Спикер дизайн-конференций DesignSpot и Dribbble Meetup',
      'Победитель международного фотоконкурса National Geographic Russia',
      'Создала дизайн-систему для финтех-приложения на 2 млн пользователей'
    ],
    lifeGoals: [
      'Собрать команду для запуска креативного медиа о культуре и человеке',
      'Посетить Исландию и запечатлеть северное сияние',
      'Окружить себя верными соратниками и верными друзьями'
    ],
    consciousnessLevel: 7,
    consciousnessTitle: 'Класс 7 • Проницательный Аналитик',
    zodiacSign: 'Скорпион',
    spiritualTradition: 'Гуманизм',
    verified: true,
    online: true,
    compatibilityScore: 89,
    distanceKm: 25
  },
  {
    id: 'dp-6',
    name: 'Роман Белов',
    username: 'roman_zen',
    age: 31,
    birthDate: '1994-01-16',
    gender: 'male',
    city: 'Алматы',
    country: 'Казахстан',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'
    ],
    goals: ['spiritual', 'travel', 'creativity'],
    bio: 'Музыкант-мультиинструменталист (хэндпан, флейты, диджериду). Провожу саунд-медитации и концерты в темноте. Ищу односознавцев, единомышленников по звуку и мудрых попутчиков по жизни.',
    occupation: 'Саунд-дизайнер & Мультиинструменталист',
    interests: ['Хэндпан', 'Этническая музыка', 'Осознанные сновидения', 'Алтай', 'Чайная культура'],
    achievements: [
      'Записал 3 студийных альбома медитативной музыки',
      'Выступал на фестивалях Trimurti, Systo и ChillOut Planet',
      'Собрал коллекцию редких акустических инструментов со всего мира'
    ],
    lifeGoals: [
      'Создать международную школу исцеления звуком',
      'Найти родственную душу для созвучия в сердце и музыке',
      'Построить купольный акустический храм для медитаций'
    ],
    consciousnessLevel: 8,
    consciousnessTitle: 'Класс 8 • Системный Гармонизатор',
    zodiacSign: 'Козерог',
    spiritualTradition: 'Славянский путь & Шаманизм',
    verified: true,
    online: false,
    lastActive: '1 час назад',
    compatibilityScore: 92,
    distanceKm: 180
  },
  {
    id: 'dp-7',
    name: 'Камилла Саттарова',
    username: 'kamilla_bali',
    age: 25,
    birthDate: '2000-05-14',
    gender: 'female',
    city: 'Убуд (Бали)',
    country: 'Индонезия',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    photos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
    ],
    goals: ['love', 'spiritual', 'travel'],
    bio: 'Живу в Убуде, организую ретриты по йоге и кундалини. Изучаю дыхательные техники и траволечение. Мечтаю встретить однодуховца для создания гармоничной семьи и вдохновляющих путешествий по планете.',
    occupation: 'Кундалини-инструктор & Основатель ретритов',
    interests: ['Кундалини-йога', 'Убуд', 'Аюрведа', 'Медитация', 'Свободный танец', 'Океан'],
    achievements: [
      'Провела 15 международных ретритов на Бали и в Таиланде',
      'Дипломированный мастер классической аюрведы',
      'Свободно владею английским и индонезийским языками'
    ],
    lifeGoals: [
      'Создать семейное эко-пространство гармонии и радости',
      'Открыть школу осознанного дыхания онлайн',
      'Исследовать древние храмы Тибета'
    ],
    consciousnessLevel: 8,
    consciousnessTitle: 'Класс 8 • Гармонизатор Пространств',
    zodiacSign: 'Телец',
    spiritualTradition: 'Кундалини & Аюрведа',
    verified: true,
    online: true,
    compatibilityScore: 95,
    distanceKm: 980
  }
];

export const POPULAR_INTERESTS_TAGS = [
  'Медитация', 'Йога', 'Самопознание', 'Психология', 'Путешествия',
  'Спорт', 'Бег', 'Музыка', 'Живопись', 'IT & Технологии', 'Философия',
  'Книги', 'Кино', 'Природа', 'Горы', 'Сноуборд', 'Астрология',
  'Здоровое питание', 'Чайные церемонии', 'Стартапы', 'Творчество',
  'Фотография', 'Кулинария', 'Дизайн', 'Плавание', 'Велосипед'
];
