// ==================== ТИПЫ ====================

export type UserRole = 'user' | 'creator' | 'business' | 'admin';
export type BeliefPrivacy = 'public' | 'followers' | 'private';

export interface ReligionItem {
  id: string;
  name: string;
  symbolTitle: string;
  iconImg: string;
  description: string;
}

export const RELIGIONS_CATALOG: ReligionItem[] = [
  {
    id: 'christianity',
    name: 'Христианство',
    symbolTitle: 'Крест',
    iconImg: '/symbols/christianity.jpg',
    description: 'Вера в Иисуса Христа, любовь к ближнему и спасение'
  },
  {
    id: 'islam',
    name: 'Ислам',
    symbolTitle: 'Полумесяц и Звезда',
    iconImg: '/symbols/islam.jpg',
    description: 'Единобожие (Таухид), следование Корану и Сунне'
  },
  {
    id: 'judaism',
    name: 'Иудаизм',
    symbolTitle: 'Звезда Давида (Маген Давид)',
    iconImg: '/symbols/judaism.jpg',
    description: 'Завет с Всевышним, Тора, этический монотеизм'
  },
  {
    id: 'hinduism',
    name: 'Индуизм',
    symbolTitle: 'Ом (Аум)',
    iconImg: '/symbols/hinduism.jpg',
    description: 'Дхарма, карма, сансара, мокша и сакральный звук Ом'
  },
  {
    id: 'buddhism',
    name: 'Буддизм',
    symbolTitle: 'Колесо Дхармы (Дхармачакра)',
    iconImg: '/symbols/buddhism.jpg',
    description: 'Благородный восьмеричный путь, осознанность и просветление'
  },
  {
    id: 'taoism',
    name: 'Даосизм',
    symbolTitle: 'Инь-Ян',
    iconImg: '/symbols/taoism.jpg',
    description: 'Путь Дао, гармония противоположностей и естественность'
  },
  {
    id: 'shinto',
    name: 'Синтоизм',
    symbolTitle: 'Тории',
    iconImg: '/symbols/shinto.jpg',
    description: 'Почитание духов природы (Ками), чистота и гармония'
  },
  {
    id: 'jainism',
    name: 'Джайнизм',
    symbolTitle: 'Ахимса (Рука)',
    iconImg: '/symbols/jainism.jpg',
    description: 'Ненасилие (Ахимса), самодисциплина и уважение к жизни'
  },
  {
    id: 'sikhism',
    name: 'Сикхизм',
    symbolTitle: 'Кханда',
    iconImg: '/symbols/sikhism.jpg',
    description: 'Служение людям, равенство, честность и медитация на Имя Бога'
  },
  {
    id: 'zoroastrianism',
    name: 'Зороастризм',
    symbolTitle: 'Фаравахар',
    iconImg: '/symbols/zoroastrianism.jpg',
    description: 'Благие мысли, благие слова, благие деяния'
  },
  {
    id: 'ayyavazhi',
    name: 'Айяважи',
    symbolTitle: 'Ловец Зла (Нама)',
    iconImg: '/symbols/ayyavazhi.jpg',
    description: 'Победа света над тьмой и духовное единство'
  },
  {
    id: 'humanism',
    name: 'Гуманизм / Светский человек',
    symbolTitle: 'Счастливый Человек',
    iconImg: '/symbols/humanism.jpg',
    description: 'Человек, наука, разум, созидание и свобода совести'
  },
  {
    id: 'none',
    name: 'Не указывать / Личное',
    symbolTitle: 'Скрыто',
    iconImg: '',
    description: 'Предпочитаю не указывать мировоззрение'
  }
];

export const BELIEF_OPTIONS = RELIGIONS_CATALOG.map(r => r.name);

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  website?: string;
  location?: string;
  online?: boolean;
  isFollowed?: boolean;
  followersCount: number;
  followingCount: number;
  criticsCount?: number;
  isCritic?: boolean;
  postsCount: number;
  highlights?: Highlight[];
  role?: UserRole;
  beliefType?: string;
  beliefPrivacy?: BeliefPrivacy;
  verified?: boolean;
  businessCategory?: string;
  rating?: number;
  salesCount?: number;
}

export interface Highlight {
  id: string;
  title: string;
  cover: string;
}

export interface Story {
  id: string;
  user: User;
  viewed: boolean;
  image?: string;
  timestamp?: string;
}

export interface Post {
  id: string;
  user: User;
  image: string;
  caption: string;
  likes: number;
  liked: boolean;
  saved?: boolean;
  comments: Comment[];
  timeAgo: string;
  location?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  timeAgo: string;
}

export interface Video {
  id: string;
  title: string;
  channel: User;
  thumbnail: string;
  videoUrl?: string;
  views: string;
  duration: string;
  timeAgo: string;
  description: string;
  likesCount?: number;
}

export interface Message {
  id: string;
  text?: string;
  fromMe: boolean;
  time: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'voice' | 'file';
  voiceDuration?: string;
  fileName?: string;
  fileSize?: string;
  conferenceRecording?: {
    title: string;
    duration: string;
    date: string;
    code: string;
  };
}

export interface Chat {
  id: string;
  user: User; // For 1-on-1 or group creator
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
  isGroup?: boolean;
  groupTitle?: string;
  groupAvatar?: string;
  membersCount?: number;
  conferenceId?: string;
}

export interface Conference {
  id: string;
  title: string;
  isPrivate: boolean; // true = только по ссылке 🔒, false = открытая 🌐
  inviteCode: string;
  host: User;
  status: 'live' | 'scheduled' | 'ended';
  startedAt?: string;
  participants: User[];
  scheduledTime?: string;
  hasRecording?: boolean;
  recordingDuration?: string;
  recordingDate?: string;
  recordingThumbnail?: string;
  chatGroupId?: string;
}

export interface Podcast {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  episodes: Episode[];
  category?: string;
}

export interface Episode {
  id: string;
  title: string;
  duration: string;
  date: string;
}

export interface ConferenceMessage {
  id: string;
  user: User;
  text: string;
  time: string;
}

// ==================== МАРКЕТПЛЕЙС ====================

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  images: string[];
  seller: User;
  category: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockCount: number;
  tags: string[];
  specs?: Record<string, string>;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  createdAt: string;
  paymentMethod: 'wallet' | 'card';
}

// ==================== СООБЩЕСТВА ====================

export interface Community {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  cover: string;
  description: string;
  category: string;
  beliefCategory?: string;
  membersCount: number;
  isPrivate: boolean;
  isJoined?: boolean;
  verified?: boolean;
  creator: User;
  rules: string[];
  events: CommunityEvent[];
  chatGroupId?: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  isOnline: boolean;
  attendeesCount: number;
  isAttending?: boolean;
}

// ==================== КОШЕЛЕК И ПОДПИСКИ ====================

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'donation_sent' | 'donation_received' | 'subscription';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  recipientOrSender?: string;
}

export interface SubscriptionTier {
  id: string;
  title: string;
  price: number;
  authorId: string;
  perks: string[];
  isSubscribed?: boolean;
}

// ==================== ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ("МОЙ ПРОФИЛЬ") ====================

export const currentUser: User = {
  id: 'me',
  name: 'Алексей Миронов',
  username: 'alex_mironov',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
  bio: 'Fullstack инженер и UI/UX энтузиаст 🚀 Создаю полезные сервисы на React + Go. Люблю чистый код и светлые интерфейсы.',
  website: 'https://github.com/alex-demo',
  location: 'Санкт-Петербург, Россия',
  online: true,
  followersCount: 1420,
  followingCount: 382,
  criticsCount: 148,
  postsCount: 24,
  role: 'creator',
  beliefType: 'Агностицизм',
  beliefPrivacy: 'public',
  verified: true,
  rating: 4.95,
  salesCount: 25,
  highlights: [
    { id: 'h1', title: 'Проекты', cover: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=150&q=80' },
    { id: 'h2', title: 'Путешествия', cover: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=150&q=80' },
    { id: 'h3', title: 'Кодинг', cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=150&q=80' },
    { id: 'h4', title: 'Книги', cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=150&q=80' },
  ],
};

// ==================== ВСЕ ПОЛЬЗОВАТЕЛИ ====================

export const initialUsers: User[] = [
  currentUser,
  {
    id: '1',
    name: 'Алиса Иванова',
    username: 'alice_iv',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    bio: 'Product Designer & Photographer 📷 Путешествия, эстетика минимализма и кофе по утрам ☕',
    website: 'https://alice-design.co',
    location: 'Москва, Россия',
    online: true,
    isFollowed: true,
    followersCount: 8420,
    followingCount: 430,
    postsCount: 156,
    role: 'business',
    businessCategory: 'Дизайн & Гаджеты',
    rating: 4.9,
    salesCount: 142,
    beliefType: 'Христианство (Православие)',
    beliefPrivacy: 'public',
    verified: true,
  },
  {
    id: '2',
    name: 'Максим Петров',
    username: 'max_p',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    bio: 'Frontend Architect. Автор подкаста и YouTube-канала про React, TypeScript и современный веб ⚡',
    website: 'https://maxpetrov.dev',
    location: 'Екатеринбург, Россия',
    online: true,
    isFollowed: false,
    followersCount: 15300,
    followingCount: 290,
    postsCount: 84,
    role: 'creator',
    beliefType: 'Атеизм / Светский гуманизм',
    beliefPrivacy: 'public',
    verified: true,
  },
  {
    id: '3',
    name: 'Екатерина Смирнова',
    username: 'kate_s',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
    bio: 'UX Research & Дизайн мышление 💡 Помогаю создавать продукты, в которые влюбляются пользователи',
    website: 'https://kate-smirnova.ru',
    location: 'Казань, Россия',
    online: false,
    isFollowed: true,
    followersCount: 6890,
    followingCount: 512,
    postsCount: 62,
    role: 'user',
    beliefType: 'Буддизм',
    beliefPrivacy: 'followers',
    verified: false,
  },
  {
    id: '4',
    name: 'Дмитрий Козлов',
    username: 'dima_k',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    bio: 'Tech Entrepreneur, со-основатель венчурного хаба. Горы, марафоны и инновации 🏔️',
    location: 'Сочи, Россия',
    online: true,
    isFollowed: true,
    followersCount: 22400,
    followingCount: 190,
    postsCount: 110,
    role: 'business',
    businessCategory: 'Аксессуары & Звук',
    rating: 4.85,
    salesCount: 89,
    beliefType: 'Иудаизм',
    beliefPrivacy: 'public',
    verified: true,
  },
  {
    id: '5',
    name: 'Ольга Новикова',
    username: 'olga_n',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    bio: 'AI Researcher & Data Scientist. Разбираем нейросети просто и доступно для каждого 🤖',
    website: 'https://ai-with-olga.com',
    location: 'Новосибирск, Россия',
    online: false,
    isFollowed: false,
    followersCount: 18700,
    followingCount: 340,
    postsCount: 75,
  },
  {
    id: '6',
    name: 'Артём Волков',
    username: 'artem_v',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    bio: 'Senior Go Developer 🐹 Создаю высоконагруженные сервисы, веду IT-подкаст «Код и Кофе»',
    location: 'Минск, Беларусь',
    online: true,
    isFollowed: true,
    followersCount: 9450,
    followingCount: 215,
    postsCount: 93,
  },
  {
    id: '7',
    name: 'Мария Лебедева',
    username: 'masha_l',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    bio: 'Food blogger & Шеф 🍕 Создаю авторские рецепты и делюсь кулинарными лайфхаками',
    location: 'Нижний Новгород, Россия',
    online: false,
    isFollowed: false,
    followersCount: 31200,
    followingCount: 680,
    postsCount: 320,
  },
  {
    id: '8',
    name: 'Иван Соколов',
    username: 'ivan_s',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
    bio: 'DevOps & Cloud Engineer ☁️ Kubernetes, Terraform, CI/CD pipelines',
    location: 'Москва, Россия',
    online: true,
    isFollowed: true,
    followersCount: 5120,
    followingCount: 180,
    postsCount: 42,
  },
];

// ==================== СТОРИС ====================

export const stories: Story[] = initialUsers.slice(1, 8).map((user, i) => ({
  id: `story-${i}`,
  user,
  viewed: i > 3,
  image: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
  ][i % 7],
  timestamp: `${(i + 1) * 2} ч назад`,
}));

// ==================== ПОСТЫ (ЛЕНТА) ====================

export const posts: Post[] = [
  {
    id: 'p0',
    user: currentUser,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
    caption: 'Запустил обновленный релиз нашего демо-сервиса! 💻 Светлая тема, профили, конференции с чатом и глобальный поиск. Оцените результат в комментариях!',
    likes: 312,
    liked: true,
    saved: true,
    timeAgo: '15 минут назад',
    location: 'Санкт-Петербург',
    comments: [
      { id: 'cm0_1', user: initialUsers[1], text: 'Выглядит просто супер! Очень чистый дизайн 🔥', timeAgo: '10 мин назад' },
      { id: 'cm0_2', user: initialUsers[6], text: 'Отличная работа по архитектуре!', timeAgo: '5 мин назад' },
    ],
  },
  {
    id: 'p1',
    user: initialUsers[1],
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
    caption: 'Утренний кофе и свежие макеты нового проекта ☕✨ Как вы настраиваетесь на продуктивный день?',
    likes: 842,
    liked: false,
    saved: false,
    timeAgo: '2 часа назад',
    location: 'Кофейня "Эстетика"',
    comments: [
      { id: 'c1', user: initialUsers[2], text: 'Красиво! Удачи с проектом 😍', timeAgo: '1 час назад' },
      { id: 'c2', user: initialUsers[3], text: 'Тоже обожаю капучино с утра!', timeAgo: '45 мин назад' },
    ],
  },
  {
    id: 'p2',
    user: initialUsers[4],
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
    caption: 'Закат в горах Кавказа 🏔️ Чистейший воздух и полная перезагрузка мыслей перед новой рабочей неделей.',
    likes: 1450,
    liked: true,
    saved: true,
    timeAgo: '5 часов назад',
    location: 'Красная Поляна, Сочи',
    comments: [
      { id: 'c3', user: initialUsers[5], text: 'Нереальный вид! На какую камеру снято?', timeAgo: '3 часа назад' },
      { id: 'c3_1', user: currentUser, text: 'Очень вдохновляющий пейзаж!', timeAgo: '2 часа назад' },
    ],
  },
  {
    id: 'p3',
    user: initialUsers[6],
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80',
    caption: 'Пишем микросервисы на Go 1.26 с минимальным потреблением памяти 🚀 Производительность поражает!',
    likes: 678,
    liked: false,
    saved: false,
    timeAgo: '8 часов назад',
    location: 'Минск',
    comments: [
      { id: 'c4', user: initialUsers[7], text: 'Go в связке с Docker — это топ связка ⚡', timeAgo: '6 часов назад' },
      { id: 'c5', user: initialUsers[8], text: 'Деплоим такие сервисы за пару минут через K8s 👍', timeAgo: '5 часов назад' },
    ],
  },
];

// ==================== ВИДЕО ====================

export const videos: Video[] = [
  {
    id: 'v1',
    title: 'Как создать полнофункциональную соцсеть на React + Go',
    channel: initialUsers[6],
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    views: '128K просмотров',
    duration: '45:20',
    timeAgo: '3 дня назад',
    likesCount: 5400,
    description: 'В этом подробном видео мы разберем архитектуру современного веб-приложения: связку React 19 с Go-бэкендом, видеоконференции, чаты в реальном времени и оптимизацию светлой темы.',
  },
  {
    id: 'v2',
    title: 'React 19 & TypeScript: современные паттерны и фичи',
    channel: initialUsers[2],
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    views: '94K просмотров',
    duration: '18:42',
    timeAgo: '1 неделю назад',
    likesCount: 4200,
    description: 'Полный обзор инноваций React: новые хуки useActionState, useOptimistic, улучшения типизации и ускорение рендеринга.',
  },
];

// ==================== ЧАТЫ (С МЕДИА, ГОЛОСОВЫМИ И ГРУППАМИ КОНФЕРЕНЦИЙ) ====================

export const initialChats: Chat[] = [
  {
    id: 'group_conf_1',
    user: initialUsers[1],
    isGroup: true,
    groupTitle: '💬 Конференция: Спринт-синк команды #104',
    groupAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&q=80',
    membersCount: 6,
    conferenceId: 'conf-104',
    lastMessage: 'Запись конференции сохранена (28 мин)',
    time: '16:32',
    unread: 1,
    messages: [
      { id: 'm_conf_1', text: 'Всем привет! Конференция началась, ссылка активна.', fromMe: false, time: '16:00' },
      { id: 'm_conf_2', text: 'Подключился! Звук и демонстрация работают отлично.', fromMe: true, time: '16:02' },
      { 
        id: 'm_conf_3', 
        fromMe: false, 
        time: '16:28',
        conferenceRecording: {
          title: 'Запись спринт-синка #104',
          duration: '28:15',
          date: 'Сегодня, 16:28',
          code: 'conf-104-rec',
        },
      },
      { id: 'm_conf_4', text: 'Запись встречи обработана и сохранена в архиве.', fromMe: false, time: '16:32' },
    ],
  },
  {
    id: 'ch1',
    user: initialUsers[1],
    lastMessage: 'Слушай, а голосовые сообщения теперь тоже можно отправлять? 🎙️',
    time: '12:45',
    unread: 2,
    messages: [
      { id: 'm1', text: 'Привет, Алексей! 👋', fromMe: false, time: '12:30' },
      { id: 'm2', text: 'Привет, Алиса! Всё отлично, обновляем дизайн мессенджера.', fromMe: true, time: '12:32' },
      { 
        id: 'm3_voice', 
        fromMe: false, 
        time: '12:35', 
        mediaType: 'voice', 
        voiceDuration: '0:18', 
        text: 'Голосовое сообщение' 
      },
      { 
        id: 'm3_media', 
        fromMe: true, 
        time: '12:40', 
        mediaType: 'image', 
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', 
        text: 'Вот новые макеты с прикреплением файлов!' 
      },
      { id: 'm5', text: 'Слушай, а голосовые сообщения теперь тоже можно отправлять? 🎙️', fromMe: false, time: '12:45' },
    ],
  },
  {
    id: 'ch2',
    user: initialUsers[2],
    lastMessage: 'Подключись в закрытую конференцию по ссылке в 16:00',
    time: '11:20',
    unread: 0,
    messages: [
      { id: 'm6', text: 'Привет! Готов к сегодняшнему синку?', fromMe: true, time: '10:00' },
      { id: 'm7', text: 'Да, презентацию собрал. Код протестирован.', fromMe: false, time: '10:05' },
      { id: 'm8', text: 'Подключись в закрытую конференцию по ссылке в 16:00', fromMe: false, time: '11:20' },
    ],
  },
  {
    id: 'ch3',
    user: initialUsers[3],
    lastMessage: 'Макеты светлого интерфейса просто отличные! 👍',
    time: 'Вчера',
    unread: 0,
    messages: [
      { id: 'm9', text: 'Екатерина, взгляни пожалуйста на новые карточки профиля.', fromMe: true, time: 'Вчера' },
      { id: 'm10', text: 'Посмотрела! Типографика и тени выглядят очень чисто.', fromMe: false, time: 'Вчера' },
      { id: 'm11', text: 'Макеты светлого интерфейса просто отличные! 👍', fromMe: false, time: 'Вчера' },
    ],
  },
];

// Backwards compatibility alias
export const chats = initialChats;

// ==================== КОНФЕРЕНЦИИ (ОТКРЫТЫЕ И ЗАКРЫТЫЕ + ЗАПИСИ) ====================

export const initialConferences: Conference[] = [
  {
    id: 'conf-104',
    title: 'Еженедельный спринт-синк команды #104',
    isPrivate: false, // Открытая
    inviteCode: 'conf-sync-104',
    host: initialUsers[2],
    status: 'live',
    startedAt: '15 минут назад',
    participants: [currentUser, initialUsers[1], initialUsers[2], initialUsers[4], initialUsers[6]],
    hasRecording: true,
    recordingDuration: '28:15',
    recordingDate: 'Сегодня, 16:28',
    recordingThumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    chatGroupId: 'group_conf_1',
  },
  {
    id: 'conf-priv-99',
    title: 'Закрытый совет инвесторов и фаундеров',
    isPrivate: true, // Закрытая (только по ссылке)
    inviteCode: 'conf-invest-sec-99',
    host: initialUsers[4],
    status: 'live',
    startedAt: '5 минут назад',
    participants: [initialUsers[4], initialUsers[5]],
    hasRecording: true,
    recordingDuration: '45:00',
    recordingDate: 'Вчера',
    recordingThumbnail: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'conf-open-202',
    title: 'Открытый митап: Разработка на Go 1.26 и микросервисы',
    isPrivate: false, // Открытая
    inviteCode: 'go-meetup-202',
    host: initialUsers[6],
    status: 'scheduled',
    scheduledTime: 'Завтра в 18:00',
    participants: [initialUsers[6], initialUsers[8]],
    hasRecording: false,
  },
];

// Сохраненные записи конференций
export const initialRecordings = [
  {
    id: 'rec-1',
    title: 'Запись: Презентация архитектуры v2 (React + Go)',
    date: '3 сен 2026, 14:30',
    duration: '42:15',
    participantsCount: 8,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    chatGroupId: 'group_conf_1',
  },
  {
    id: 'rec-2',
    title: 'Запись: Ревью светлого UI/UX дизайна и Telegram-мессенджера',
    date: '2 сен 2026, 18:00',
    duration: '26:40',
    participantsCount: 5,
    thumbnail: 'https://images.unsplash.com/photo-1581291518655-9523c932deda?auto=format&fit=crop&w=800&q=80',
  },
];

// ==================== ПОДКАСТЫ ====================

export const podcasts: Podcast[] = [
  {
    id: 'pod1',
    title: 'Код и Кофе',
    author: 'Артём Волков',
    category: 'Технологии & IT',
    cover: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=400&q=80',
    description: 'Еженедельный подкаст об архитектуре программного обеспечения, переходе на Go, микросервисах и карьере.',
    episodes: [
      { id: 'e1', title: 'React 19 vs современные фреймворки в 2026 году', duration: '48:20', date: '1 сен 2026' },
      { id: 'e2', title: 'Путь Senior разработчика: от джуна до архитектора', duration: '39:15', date: '25 авг 2026' },
    ],
  },
];

// ==================== УЧАСТНИКИ КОНФЕРЕНЦИИ ПО УМОЛЧАНИЮ ====================

export const conferenceParticipants: User[] = [
  currentUser,
  initialUsers[1],
  initialUsers[2],
  initialUsers[4],
  initialUsers[5],
  initialUsers[6],
];

// ==================== СООБЩЕНИЯ ЧАТА КОНФЕРЕНЦИИ ====================

export const initialConferenceMessages: ConferenceMessage[] = [
  { id: 'cm1', user: initialUsers[1], text: 'Всем привет! Связь отличная, картинка четкая 👍', time: '16:02' },
  { id: 'cm2', user: initialUsers[6], text: 'Привет! Презентацию по бэкенду видно?', time: '16:03' },
  { id: 'cm3', user: currentUser, text: 'Да, всё прекрасно видно! Давайте начинать синк.', time: '16:04' },
  { id: 'cm4', user: initialUsers[2], text: 'Я включил запись конференции, после завершения видео появится в чат-группе.', time: '16:05' },
];

// ==================== МАРКЕТПЛЕЙС ТОВАРЫ ====================

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Кастомная механическая клавиатура New Age 75% Wireless',
    description: 'Алюминиевый корпус, смазанные линейные свитчи Gateron Oil King, RGB-подсветка и беспроводное подключение 2.4G/Bluetooth.',
    price: 12990,
    oldPrice: 15490,
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80'
    ],
    seller: initialUsers[1],
    category: 'Электроника',
    rating: 4.9,
    reviewsCount: 38,
    inStock: true,
    stockCount: 14,
    tags: ['Клавиатура', 'Гаджеты', 'Рабочее место'],
    specs: {
      'Тип переключателей': 'Gateron Oil King (Linear)',
      'Подключение': 'USB Type-C, Bluetooth 5.2, 2.4GHz',
      'Емкость аккумулятора': '4000 мАч',
      'Материал': 'CNC Алюминий'
    },
    createdAt: '2026-09-01'
  },
  {
    id: 'prod-2',
    title: 'Книга «Паттерны архитектуры высоконагруженных систем 2026»',
    description: 'Практическое руководство по построению распределенных систем на Go, микросервисов, очередей сообщений и масштабированию баз данных.',
    price: 2490,
    oldPrice: 2990,
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80'
    ],
    seller: initialUsers[2],
    category: 'Книги',
    rating: 5.0,
    reviewsCount: 64,
    inStock: true,
    stockCount: 85,
    tags: ['IT', 'Архитектура', 'Go', 'Книги'],
    specs: {
      'Количество страниц': '540 стр.',
      'Переплет': 'Твердый',
      'Язык': 'Русский',
      'Год издания': '2026'
    },
    createdAt: '2026-08-28'
  },
  {
    id: 'prod-3',
    title: 'Чехол-папка из натуральной кожи для MacBook 14" / 16"',
    description: 'Ручная работа мастеров из Санкт-Петербурга. Премиальная итальянская кожа растительного дубления, мягкая подкладка из микрофибры.',
    price: 4800,
    oldPrice: 5500,
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'
    ],
    seller: initialUsers[4],
    category: 'Аксессуары',
    rating: 4.8,
    reviewsCount: 22,
    inStock: true,
    stockCount: 7,
    tags: ['Кожа', 'MacBook', 'Ручная работа'],
    specs: {
      'Совместимость': 'MacBook Pro 14", MacBook Air 13.6"',
      'Материал': 'Натуральная кожа Crazy Horse',
      'Цвет': 'Глубокий шоколад'
    },
    createdAt: '2026-08-30'
  },
  {
    id: 'prod-4',
    title: 'Студийный конденсаторный USB-микрофон New Age Pro Podcast',
    description: 'Идеальное решение для записи подкастов, стримов и видеоконференций с кардиоидной диаграммой и встроенным поп-фильтром.',
    price: 9900,
    oldPrice: 11900,
    images: [
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80'
    ],
    seller: initialUsers[4],
    category: 'Электроника',
    rating: 4.9,
    reviewsCount: 45,
    inStock: true,
    stockCount: 19,
    tags: ['Подкасты', 'Звук', 'Микрофон'],
    specs: {
      'Частотный диапазон': '20 Гц – 20 кГц',
      'Частота дискретизации': '24 бит / 96 кГц',
      'Подключение': 'USB-C (Plug & Play)'
    },
    createdAt: '2026-09-02'
  },
  {
    id: 'prod-5',
    title: 'Худи оверсайз из плотного органического хлопка «New Age Minimalist»',
    description: 'Премиальный плотный трикотаж 460 г/м², свободный оверсайз крой, мягкий начес, минималистичный вышитый логотип New Age на груди.',
    price: 5200,
    oldPrice: 6200,
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'
    ],
    seller: currentUser,
    category: 'Одежда и стиль',
    rating: 4.9,
    reviewsCount: 19,
    inStock: true,
    stockCount: 25,
    tags: ['Мерч', 'Худи', 'Одежда', 'New Age'],
    specs: {
      'Состав': '100% органический хлопок',
      'Плотность': '460 г/м²',
      'Уход': 'Деликатная стирка при 30°C'
    },
    createdAt: '2026-09-03'
  }
];

// ==================== СООБЩЕСТВА ====================

export const initialCommunities: Community[] = [
  {
    id: 'comm-1',
    name: 'Go & Cloud Architecture',
    handle: 'golang_ru',
    avatar: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=300&q=80',
    cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    description: 'Сообщество инженеров, бэкенд-разработчиков и архитекторов облачных решений на Go, Kubernetes и gRPC.',
    category: 'IT & Технологии',
    membersCount: 14200,
    isPrivate: false,
    isJoined: true,
    verified: true,
    creator: currentUser,
    rules: [
      'Уважительное профессиональное общение',
      'Только конструктивный код-ревью без токсичности',
      'Запрещен прямой спам и нецелевая реклама'
    ],
    events: [
      {
        id: 'ev-1',
        title: 'Онлайн-митап: Архитектура мессенджера на Go и WebSockets',
        date: '20 сентября 2026',
        time: '19:00 МСК',
        location: 'Комната New Age Conferences',
        isOnline: true,
        attendeesCount: 342,
        isAttending: true
      }
    ],
    chatGroupId: 'group_comm_go'
  },
  {
    id: 'comm-2',
    name: 'Философия & Мировоззрения XXI Века',
    handle: 'philosophy_open',
    avatar: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=300&q=80',
    cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    description: 'Открытая площадка для уважительного диалога между представителями различных конфессий, традиций и светского гуманизма.',
    category: 'Мировоззрение & Философия',
    beliefCategory: 'Межконфессиональный диалог',
    membersCount: 8400,
    isPrivate: false,
    isJoined: false,
    verified: true,
    creator: initialUsers[3],
    rules: [
      'Строгий запрет на оскорбление чувств верующих и дискриминацию',
      'Конструктивный философский обмен мнениями',
      'Модерация по принципам взаимного уважения'
    ],
    events: [
      {
        id: 'ev-2',
        title: 'Круглый стол: Этика искусственного интеллекта и сознание',
        date: '25 сентября 2026',
        time: '18:30 МСК',
        location: 'Санкт-Петербург + Онлайн трансляция',
        isOnline: true,
        attendeesCount: 180,
        isAttending: false
      }
    ],
    chatGroupId: 'group_comm_philo'
  },
  {
    id: 'comm-3',
    name: 'Product Design & Светлые Интерфейсы',
    handle: 'light_ui_design',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    description: 'Всё о проектировании чистых, эстетичных светлых интерфейсов, микроанимациях, дизайн-системах и типографике.',
    category: 'Дизайн & Арт',
    membersCount: 19800,
    isPrivate: false,
    isJoined: true,
    verified: true,
    creator: initialUsers[1],
    rules: [
      'Делитесь реальными кейсами и макетами в Figma',
      'Конструктивная критика с аргументами'
    ],
    events: [],
    chatGroupId: 'group_comm_design'
  },
  {
    id: 'comm-4',
    name: 'Инди-Хакеры и Микробизнес',
    handle: 'indie_hackers_hub',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    description: 'Клуб создателей собственных цифровых продуктов, инди-разработчиков и продавцов на маркетплейсах.',
    category: 'Бизнес & Стартапы',
    membersCount: 11300,
    isPrivate: false,
    isJoined: false,
    verified: false,
    creator: initialUsers[4],
    rules: [
      'Прозрачность: делимся выручкой, метриками и фейлами',
      'Взаимная поддержка на старте'
    ],
    events: [],
    chatGroupId: 'group_comm_indie'
  }
];

// ==================== ТРАНЗАКЦИИ КОШЕЛЬКА ====================

export const initialTransactions: WalletTransaction[] = [
  {
    id: 'tx-1',
    type: 'sale',
    amount: 5200,
    description: 'Продажа: Худи оверсайз New Age',
    date: '14 сен 2026, 10:15',
    status: 'completed',
    recipientOrSender: 'Покупатель @kate_s'
  },
  {
    id: 'tx-2',
    type: 'donation_received',
    amount: 1000,
    description: 'Донат за выпуск подкаста «Код и Кофе»',
    date: '12 сен 2026, 17:40',
    status: 'completed',
    recipientOrSender: 'От @dima_k'
  },
  {
    id: 'tx-3',
    type: 'purchase',
    amount: -2490,
    description: 'Покупка книги «Паттерны архитектуры»',
    date: '08 сен 2026, 14:20',
    status: 'completed',
    recipientOrSender: 'Продавец @max_p'
  },
  {
    id: 'tx-4',
    type: 'deposit',
    amount: 15000,
    description: 'Пополнение кошелька через СБП',
    date: '01 сен 2026, 09:00',
    status: 'completed'
  }
];

// ==================== АВТОРСКИЕ ПОДПИСКИ ====================

export const initialSubscriptionTiers: SubscriptionTier[] = [
  {
    id: 'tier-1',
    title: 'Поддержка автора ☕',
    price: 199,
    authorId: 'me',
    perks: [
      'Особый бейдж спонсора в комментариях и чате',
      'Доступ к закрытому Telegram-чату для спонсоров',
      'Ранний доступ к новым видео и статьям'
    ],
    isSubscribed: false
  },
  {
    id: 'tier-2',
    title: 'Продвинутый разработчик 🚀',
    price: 499,
    authorId: 'me',
    perks: [
      'Все привилегии базового уровня',
      'Эксклюзивные исходные коды и шаблоны проектов',
      'Участие в закрытых ежемесячных Q&A видеоконференциях'
    ],
    isSubscribed: true
  },
  {
    id: 'tier-3',
    title: 'Персональный менторинг 💼',
    price: 2490,
    authorId: 'me',
    perks: [
      'Все предыдущие привилегии',
      'Личный разбор вашего проекта и резюме (1 раз в месяц)',
      'Прямой контакт в личном мессенджере с приоритетом'
    ],
    isSubscribed: false
  }
];

