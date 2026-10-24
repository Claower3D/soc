/**
 * Data structures for New Age Dating & Resonance module
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
    icon: '',
    description: 'Искренние романтические чувства, свидания и глубокая взаимная привязанность.',
    badgeClass: 'badge-pink',
    color: '#EC4899'
  },
  {
    id: 'family',
    label: 'Создание семьи',
    shortLabel: 'Семья',
    icon: '',
    description: 'Серьезные отношения, построение домашнего очага и осознанное партнерство.',
    badgeClass: 'badge-rose',
    color: '#F43F5E'
  },
  {
    id: 'friends',
    label: 'Поиск друзей',
    shortLabel: 'Дружба',
    icon: '',
    description: 'Искренняя дружба, душевные беседы, совместные прогулки и поддержка.',
    badgeClass: 'badge-blue',
    color: '#3B82F6'
  },
  {
    id: 'spiritual',
    label: 'Односознавцы & Духовные практики',
    shortLabel: 'Односознавцы',
    icon: '',
    description: 'Единомышленники по уровню сознания (1-11), медитации, ретриты, познание Дао и сути.',
    badgeClass: 'badge-purple',
    color: '#8B5CF6'
  },
  {
    id: 'creativity',
    label: 'Творчество & Искусство',
    shortLabel: 'Творчество',
    icon: '',
    description: 'Музыкальные джемы, живопись, дизайн, писательство и создание шедевров.',
    badgeClass: 'badge-amber',
    color: '#F59E0B'
  },
  {
    id: 'travel',
    label: 'Путешествия & Экспедиции',
    shortLabel: 'Путешествия',
    icon: '',
    description: 'Поездки по местам силы, горы Алтая, океан, походы и новые города.',
    badgeClass: 'badge-teal',
    color: '#14B8A6'
  },
  {
    id: 'business',
    label: 'Проекты & Партнерство',
    shortLabel: 'Проекты',
    icon: '',
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

// 0 фейковых анкет: база данных подключается к серверу и хранит только реальные анкеты
export const INITIAL_DATING_PROFILES: DatingProfile[] = [];

export const POPULAR_INTERESTS_TAGS = [
  'Медитация', 'Йога', 'Самопознание', 'Психология', 'Путешествия',
  'Спорт', 'Бег', 'Музыка', 'Живопись', 'IT & Технологии', 'Философия',
  'Книги', 'Кино', 'Природа', 'Горы', 'Сноуборд', 'Астрология',
  'Здоровое питание', 'Чайные церемонии', 'Стартапы', 'Творчество',
  'Фотография', 'Кулинария', 'Дизайн', 'Плавание', 'Велосипед'
];
