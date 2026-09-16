// ==================== ТИПЫ ====================

export type UserRole = 'user' | 'creator' | 'business' | 'admin' | 'expert' | 'critic';
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
  consciousnessLevel?: number; // Класс сознания от 1 до 11
  consciousnessTitle?: string; // Название класса сознания
  cognitionVector?: 'spiritual' | 'exact_sciences' | 'visual_analogies' | 'philosophical' | 'pragmatic'; // Вектор восприятия
  birthDate?: string; // Дата рождения (ГГГГ-ММ-ДД)
  zodiacSign?: string; // Знак зодиака (Овен, Телец...)
  easternZodiac?: string; // Восточный знак (Дракон, Тигр...)
  gender?: 'male' | 'female' | 'other' | 'hidden'; // Пол
  showBirthDate?: boolean; // Показывать дату рождения
  showZodiac?: boolean; // Показывать знак зодиака
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
  gradient?: string;
  videoUrl?: string;
  isLive?: boolean;
  liveViewers?: number;
  filter?: string;
  mask?: string;
  text?: string;
  textPosition?: 'center' | 'bottom' | 'top';
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

export interface VideoComment {
  id: string;
  user: User;
  text: string;
  timeAgo: string;
  likes: number;
}

export interface StreamChatMessage {
  id: string;
  username: string;
  color?: string;
  badge?: string;
  text: string;
  time: string;
  isDonation?: boolean;
  donationAmount?: string;
}

export interface SeriesEpisode {
  id: string;
  title: string;
  seasonNumber: number;
  episodeNumber: number;
  duration: string;
  thumbnail: string;
  videoUrl?: string;
  description?: string;
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
  category?: string;
  type?: 'video' | 'movie' | 'series' | 'cartoon' | 'stream';
  isKids?: boolean;
  isMovie?: boolean;
  isSeries?: boolean;
  isStream?: boolean;
  streamGameOrTopic?: string;
  viewersCount?: number;
  streamChat?: StreamChatMessage[];
  seriesInfo?: {
    seasonsCount: number;
    episodesCount: number;
    currentSeason?: number;
    currentEpisode?: number;
    episodes?: SeriesEpisode[];
  };
  rating?: number; // Рейтинг Кинопоиск/IMDb для фильмов и сериалов (e.g. 8.4)
  ageRating?: string; // 0+, 6+, 12+, 16+, 18+
  genre?: string;
  releaseYear?: number;
  isFromSubscription?: boolean;
  comments?: VideoComment[];
}

export interface ClipComment {
  id: string;
  user: User;
  text: string;
  timeAgo: string;
  likes?: number;
}

export interface Clip {
  id: string;
  user: User;
  videoUrl?: string;
  poster: string;
  caption: string;
  musicTitle?: string;
  musicAuthor?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  tags?: string[];
  comments?: ClipComment[];
  timeAgo?: string;
  isAiGenerated?: boolean;
  audioTrackArt?: string;
  overlayTitle?: string;
  isHorizontal?: boolean;
  isLive?: boolean;
  viewersCount?: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  id?: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  votedOptionId?: string;
  userVotedOptionId?: string;
  isMultiple?: boolean;
  isClosed?: boolean;
}

export interface EventData {
  id?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendeesCount?: number;
  participantsCount?: number;
  isAttending?: boolean;
}

export interface ProductData {
  id: string;
  title: string;
  price: number;
  currency?: string;
  image?: string;
  imageUrl?: string;
  type?: 'product' | 'service';
  category?: string;
  sellerName?: string;
  commissionPercent?: number;
  rating?: number;
  authorName?: string;
}

export interface ContactData {
  id?: string;
  name: string;
  username: string;
  avatar: string;
  phone?: string;
  consciousnessLevel?: number;
  role?: string;
}

export interface Message {
  id: string;
  text?: string;
  fromMe: boolean;
  time: string;
  forwardedFrom?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'voice' | 'file' | 'video_note' | 'poll' | 'event' | 'product' | 'contact' | 'sticker' | 'gif' | 'audio' | 'document';
  voiceDuration?: string;
  voiceBlobUrl?: string;
  videoNoteUrl?: string;
  stickerUrl?: string;
  gifUrl?: string;
  audioTitle?: string;
  audioAuthor?: string;
  fileName?: string;
  fileSize?: string;
  pollData?: PollData;
  eventData?: EventData;
  productData?: ProductData;
  contactData?: ContactData;
  status?: 'sent' | 'delivered' | 'read';
  reactions?: Array<{ emoji: string; count: number; fromMe?: boolean }>;
  isPinned?: boolean;
  conferenceRecording?: {
    title: string;
    duration: string;
    date: string;
    code: string;
  };
}

export interface ChatTag {
  id: string;
  title: string;
  color: string;
}

export const CHAT_TAGS: ChatTag[] = [
  { id: 'new_client', title: 'Новый клиент', color: '#3B82F6' },
  { id: 'order_completed', title: 'Заказ выполнен', color: '#10B981' },
  { id: 'in_progress', title: 'В работе', color: '#F59E0B' },
  { id: 'payment_waiting', title: 'Ожидает оплаты', color: '#EC4899' },
];

export interface ChatTheme {
  id: string;
  name: string;
  previewBg: string;
  background: string;
  bubbleMeBg?: string;
  bubbleMeColor?: string;
  bubbleThemBg?: string;
  bubbleThemColor?: string;
  accentColor?: string;
}

export const CHAT_THEMES: ChatTheme[] = [
  {
    id: 'default',
    name: 'Классическая',
    previewBg: '#F8FAFC',
    background: 'var(--color-bg)',
    bubbleMeBg: '#6366F1',
    bubbleMeColor: '#FFFFFF',
    bubbleThemBg: 'var(--color-bg-card)',
    bubbleThemColor: 'var(--color-text)',
    accentColor: '#6366F1'
  },
  {
    id: 'space',
    name: 'Космический Zen',
    previewBg: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
    background: 'linear-gradient(160deg, #0b0f19 0%, #17153b 50%, #0d1117 100%)',
    bubbleMeBg: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    bubbleMeColor: '#FFFFFF',
    bubbleThemBg: 'rgba(30, 41, 59, 0.75)',
    bubbleThemColor: '#F1F5F9',
    accentColor: '#8B5CF6'
  },
  {
    id: 'cyberpunk',
    name: 'Неон & Киберпанк',
    previewBg: 'linear-gradient(135deg, #18052B 0%, #3B0764 100%)',
    background: 'linear-gradient(150deg, #10001f 0%, #290838 50%, #080010 100%)',
    bubbleMeBg: 'linear-gradient(135deg, #EC4899 0%, #A855F7 100%)',
    bubbleMeColor: '#FFFFFF',
    bubbleThemBg: 'rgba(59, 7, 100, 0.55)',
    bubbleThemColor: '#FDF4FF',
    accentColor: '#EC4899'
  },
  {
    id: 'emerald',
    name: 'Изумрудный Оазис',
    previewBg: 'linear-gradient(135deg, #022C22 0%, #064E3B 100%)',
    background: 'linear-gradient(150deg, #021a14 0%, #063d2e 50%, #021b14 100%)',
    bubbleMeBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    bubbleMeColor: '#FFFFFF',
    bubbleThemBg: 'rgba(6, 78, 59, 0.45)',
    bubbleThemColor: '#ECFDF5',
    accentColor: '#10B981'
  },
  {
    id: 'sunset',
    name: 'Солнечный Закат',
    previewBg: 'linear-gradient(135deg, #431407 0%, #7C2D12 100%)',
    background: 'linear-gradient(150deg, #1f0802 0%, #4a1908 50%, #1c0602 100%)',
    bubbleMeBg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
    bubbleMeColor: '#FFFFFF',
    bubbleThemBg: 'rgba(124, 45, 18, 0.45)',
    bubbleThemColor: '#FFF7ED',
    accentColor: '#F97316'
  },
  {
    id: 'minimal_dark',
    name: 'Темный Минимализм',
    previewBg: '#1E293B',
    background: '#0F172A',
    bubbleMeBg: '#334155',
    bubbleMeColor: '#FFFFFF',
    bubbleThemBg: '#1E293B',
    bubbleThemColor: '#E2E8F0',
    accentColor: '#94A3B8'
  }
];

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
  isPinned?: boolean;
  isSystem?: boolean;
  isArchived?: boolean;
  isLocked?: boolean;
  pinCode?: string;
  customTheme?: ChatTheme;
  isFavorite?: boolean;
  isImportant?: boolean;
  tagId?: string;
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
  birthDate: '1995-04-12',
  zodiacSign: 'Овен ♈',
  easternZodiac: 'Деревянная Свинья (Кабан) 🐗',
  gender: 'male',
  showBirthDate: true,
  showZodiac: true,
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
  isLive: i === 0, // First story is live broadcast
  liveViewers: i === 0 ? 42 : undefined,
  filter: i === 1 ? 'Paris (Мягкий)' : i === 2 ? 'Tokyo (Неон)' : undefined,
  mask: i === 0 ? '✨ Блестки' : i === 1 ? '🕶️ Крутые очки' : undefined,
  image: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
  ][i % 7],
  text: i === 0 ? '🔴 В прямом эфире! Обсуждаем новинки' : undefined,
  textPosition: 'center',
  timestamp: i === 0 ? 'В ЭФИРЕ' : `${(i + 1) * 2} ч назад`,
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
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    views: '128K просмотров',
    duration: '45:20',
    timeAgo: '3 дня назад',
    likesCount: 5400,
    category: 'Разработка',
    description: 'В этом подробном видео мы разберем архитектуру современного веб-приложения: связку React 19 с Go-бэкендом, видеоконференции, чаты в реальном времени и оптимизацию светлой темы.',
    comments: [
      { id: 'vc1', user: initialUsers[2], text: 'Отличный разбор архитектуры! Особенно часть с WebSocket и хранилищем сессий 🔥', timeAgo: '2 дня назад', likes: 34 },
      { id: 'vc2', user: initialUsers[4], text: 'Жду вторую часть про деплой в Kubernetes кластер!', timeAgo: '1 день назад', likes: 12 },
      { id: 'vc3', user: initialUsers[1], text: 'Очень чисто написан код, спасибо огромное за такой качественный материал ❤️', timeAgo: '14 часов назад', likes: 8 },
    ]
  },
  {
    id: 'v2',
    title: 'React 19 & TypeScript: современные паттерны и фичи',
    channel: initialUsers[2],
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    views: '94K просмотров',
    duration: '18:42',
    timeAgo: '1 неделю назад',
    likesCount: 4200,
    category: 'Разработка',
    description: 'Полный обзор инноваций React: новые хуки useActionState, useOptimistic, улучшения типизации и ускорение рендеринга.',
    comments: [
      { id: 'vc4', user: initialUsers[6], text: 'useOptimistic сильно упростил работу с интерфейсом чатов, супер!', timeAgo: '4 дня назад', likes: 19 },
    ]
  },
  // ==================== РАЗДЕЛ: ФИЛЬМЫ ====================
  {
    id: 'm1',
    title: 'Интерстеллар: Путешествие сквозь пространство и время',
    channel: {
      id: 'cinema_official',
      name: 'New Age Cinema 🎬',
      username: 'cinema_official',
      avatar: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80',
      online: true,
      verified: true,
      role: 'business',
      followersCount: 245000,
      followingCount: 15,
      postsCount: 420
    },
    thumbnail: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    views: '2.4M просмотров',
    duration: '2:49:15',
    timeAgo: '2 недели назад',
    likesCount: 184000,
    category: 'Фильмы',
    isMovie: true,
    rating: 8.7,
    ageRating: '12+',
    genre: 'Фантастика, Драма',
    releaseYear: 2014,
    description: 'Культовый научно-фантастический шедевр. Когда засуха и пыльные бури ставят человечество перед угрозой вымирания, группа исследователей отправляется сквозь недавно обнаруженную червоточину в поисках нового дома среди звезд.',
    comments: [
      { id: 'cm_f1', user: initialUsers[1], text: 'Музыка Ханса Циммера до сих пор пробирает до мурашек каждый раз 🚀✨', timeAgo: '5 дней назад', likes: 156 },
      { id: 'cm_f2', user: initialUsers[3], text: 'Один из лучших научно-фантастических фильмов в истории кинематографа!', timeAgo: '3 дня назад', likes: 89 },
    ]
  },
  {
    id: 'm2',
    title: 'Начало (Inception): Архитектура осознанных сновидений',
    channel: {
      id: 'cinema_official',
      name: 'New Age Cinema 🎬',
      username: 'cinema_official',
      avatar: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80',
      online: true,
      verified: true,
      role: 'business',
      followersCount: 245000,
      followingCount: 15,
      postsCount: 420
    },
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    views: '1.9M просмотров',
    duration: '2:28:00',
    timeAgo: '1 месяц назад',
    likesCount: 142000,
    category: 'Фильмы',
    isMovie: true,
    rating: 8.8,
    ageRating: '16+',
    genre: 'Боевик, Фантастика, Триллер',
    releaseYear: 2010,
    description: 'Дом Кобб — непревзойденный мастер промышленного шпионажа, крадущий ценные тайны из глубин подсознания во время сна. Но теперь ему предстоит не украсть идею, а внедрить её в сознание наследника корпорации.',
    comments: [
      { id: 'cm_f3', user: initialUsers[5], text: 'Концовка с волчком — это вечная загадка! Лучший сюжет.', timeAgo: '1 неделю назад', likes: 94 },
    ]
  },
  {
    id: 'm3',
    title: 'Космическая Одиссея: Горизонты будущего и квантовый разум',
    channel: {
      id: 'cinema_official',
      name: 'New Age Cinema 🎬',
      username: 'cinema_official',
      avatar: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80',
      online: true,
      verified: true,
      role: 'business',
      followersCount: 245000,
      followingCount: 15,
      postsCount: 420
    },
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    views: '680K просмотров',
    duration: '1:54:30',
    timeAgo: '3 недели назад',
    likesCount: 45000,
    category: 'Фильмы',
    isMovie: true,
    rating: 8.3,
    ageRating: '12+',
    genre: 'Фантастика, Приключения',
    releaseYear: 2023,
    description: 'Увлекательная космическая одиссея сквозь червоточины и параллельные вселенные в поисках ответов на главные тайны мироздания.',
    comments: [
      { id: 'cm_f4', user: initialUsers[4], text: 'Визуальные эффекты космоса просто завораживают на большом экране!', timeAgo: '2 дня назад', likes: 23 },
    ]
  },
  // ==================== РАЗДЕЛ: ДЕТЯМ И МУЛЬТИКИ (ДЕТСКИЙ РЕЖИМ) ====================
  {
    id: 'k1',
    title: 'Большой Кролик Бак (Big Buck Bunny) — Весёлые лесные приключения',
    channel: {
      id: 'kids_channel',
      name: 'Мультиландия 🎈',
      username: 'kids_multiki',
      avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80',
      online: true,
      verified: true,
      role: 'creator',
      followersCount: 512000,
      followingCount: 10,
      postsCount: 180
    },
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    views: '5.8M просмотров',
    duration: '09:56',
    timeAgo: '1 месяц назад',
    likesCount: 310000,
    category: 'Мультфильмы',
    isKids: true,
    ageRating: '0+',
    genre: 'Мультфильм, Сказка, Комедия',
    releaseYear: 2024,
    description: 'Добрый и смешной мультфильм для самых маленьких зрителей о добродушном лесном кролике и его забавных друзьях. Без возрастных ограничений!',
    comments: [
      { id: 'cm_k1', user: initialUsers[7], text: 'Дети смотрят с огромным восторгом уже десятый раз! Очень добрый мультик 🐰🎉', timeAgo: '3 дня назад', likes: 78 },
    ]
  },
  {
    id: 'k2',
    title: 'Синтел и Маленький Дракончик — Сказка о дружбе и храбрости',
    channel: {
      id: 'kids_channel',
      name: 'Мультиландия 🎈',
      username: 'kids_multiki',
      avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80',
      online: true,
      verified: true,
      role: 'creator',
      followersCount: 512000,
      followingCount: 10,
      postsCount: 180
    },
    thumbnail: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    views: '3.2M просмотров',
    duration: '14:48',
    timeAgo: '2 недели назад',
    likesCount: 195000,
    category: 'Мультфильмы',
    isKids: true,
    ageRating: '6+',
    genre: 'Анимация, Фэнтези, Сказка',
    releaseYear: 2023,
    description: 'Удивительная сказочная история о дружбе смелой девочки Синтел и маленького дракончика, преодолевающего все преграды на пути.',
    comments: [
      { id: 'cm_k2', user: initialUsers[1], text: 'Прекрасная анимация и трогательная добрая история для всей семьи ❤️', timeAgo: '1 день назад', likes: 45 },
    ]
  },
  {
    id: 'k3',
    title: 'Приключения в Долине Бабочек: Познавательные сказки для малышей',
    channel: {
      id: 'kids_channel',
      name: 'Мультиландия 🎈',
      username: 'kids_multiki',
      avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=200&q=80',
      online: true,
      verified: true,
      role: 'creator',
      followersCount: 512000,
      followingCount: 10,
      postsCount: 180
    },
    thumbnail: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    views: '1.4M просмотров',
    duration: '11:20',
    timeAgo: '5 дней назад',
    likesCount: 88000,
    category: 'Мультфильмы',
    isKids: true,
    ageRating: '0+',
    genre: 'Обучающий мультфильм',
    releaseYear: 2024,
    description: 'Учим цвета, числа и добрые поступки вместе с маленькими зверятами в волшебной цветущей долине.',
    comments: [
      { id: 'cm_k3', user: initialUsers[7], text: 'Безопасный и полезный контент для малышей, спасибо разработчикам за детский режим!', timeAgo: '4 часа назад', likes: 31 },
    ]
  },
  // ==================== РАЗДЕЛ: СТРИМЫ (TWITCH LIVE ZONE) ====================
  {
    id: 'st1',
    title: 'Cyberpunk 2077: Phantom Liberty — Прохождение на максималках 4K RTX',
    channel: {
      id: 'streamer_alex',
      name: 'AlexCyber 🎮',
      username: 'alex_cyber',
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
      online: true,
      verified: true,
      role: 'creator',
      followersCount: 184000,
      followingCount: 30,
      postsCount: 420
    },
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    views: '14.2K зрителей',
    duration: 'LIVE',
    timeAgo: 'В эфире 2 часа',
    likesCount: 12400,
    category: 'Игры',
    type: 'stream',
    isStream: true,
    viewersCount: 14280,
    streamGameOrTopic: 'Cyberpunk 2077',
    genre: 'Стрим, Игры, Экшен',
    description: 'Исследуем Пёсий город на максимальной сложности со всеми графическими модами и трассировкой путей. Общаемся в чате, розыгрыши ключей каждый час!',
    streamChat: [
      { id: 'sc1', username: 'PixelMaster', color: '#3b82f6', badge: 'VIP', text: 'Какая графика нереальная! Сколько FPS держит?', time: '16:02' },
      { id: 'sc2', username: 'CyberKatya', color: '#ec4899', badge: 'MOD', text: 'Всем привет в чате! Не забывайте про правила стрима ✨', time: '16:04' },
      { id: 'sc3', username: 'Gamer_99', color: '#10b981', text: 'Билд на нетраннера просто имба 🔥', time: '16:05' },
      { id: 'sc4', username: 'Dmitry_K', color: '#f59e0b', badge: 'SUB', isDonation: true, donationAmount: '500 ₽', text: 'На новый SSD диск! Отличный стрим, бро!', time: '16:07' },
      { id: 'sc5', username: 'V_NightCity', color: '#8b5cf6', text: 'Смотрим до финала сегодня? 🚀', time: '16:08' },
    ]
  },
  {
    id: 'st2',
    title: 'Live Coding: Разрабатываем микросервисы на Go 1.26 и React 19 с нуля',
    channel: initialUsers[6], // Артём Волков
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    views: '3.9K зрителей',
    duration: 'LIVE',
    timeAgo: 'В эфире 45 мин',
    likesCount: 5100,
    category: 'Разработка',
    type: 'stream',
    isStream: true,
    viewersCount: 3920,
    streamGameOrTopic: 'Software Engineering',
    genre: 'IT, Программирование, Образование',
    description: 'Прямой эфир с разбором чистого кода, горутин, оптимизации запросов и построения веб-сокетов для высоконагруженных соцсетей.',
    streamChat: [
      { id: 'sc6', username: 'CodeNinja', color: '#10b981', badge: 'PRO', text: 'Go в связке с gRPC просто летает!', time: '16:10' },
      { id: 'sc7', username: 'Max_Dev', color: '#3b82f6', text: 'А как организован пул воркеров в этом модуле?', time: '16:11' },
      { id: 'sc8', username: 'Elena_QA', color: '#ec4899', isDonation: true, donationAmount: '1 000 ₽', text: 'Спасибо за супер-информативные стримы! Ждем архитектурную книгу.', time: '16:14' },
    ]
  },
  {
    id: 'st3',
    title: 'Lo-Fi Chill & Synthwave Session: Музыкальный джем в реальном времени 🎧',
    channel: {
      id: 'lofi_lab',
      name: 'Lo-Fi Universe 🎵',
      username: 'lofi_universe',
      avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80',
      online: true,
      verified: true,
      role: 'creator',
      followersCount: 96000,
      followingCount: 12,
      postsCount: 150
    },
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    views: '6.4K зрителей',
    duration: 'LIVE',
    timeAgo: 'В эфире 5 часов',
    likesCount: 8900,
    category: 'Музыка',
    type: 'stream',
    isStream: true,
    viewersCount: 6410,
    streamGameOrTopic: 'Музыка и Творчество',
    genre: 'Lo-Fi, Музыка, Отдых',
    description: 'Уютная атмосфера для работы, учёбы и медитации. Живое сведение аналоговых синтезаторов и тёплых виниловых сэмплов.',
    streamChat: [
      { id: 'sc9', username: 'SleepyCat', color: '#f59e0b', text: 'Идеальный трек под ночной кодинг ☕', time: '16:15' },
      { id: 'sc10', username: 'ArtVision', color: '#8b5cf6', badge: 'SUB', text: 'Визуал просто космос, спасибо за вайб!', time: '16:16' }
    ]
  },
  // ==================== РАЗДЕЛ: СЕРИАЛЫ ====================
  {
    id: 's1',
    title: 'Кремниевая долина: Новая эра искусственного интеллекта',
    channel: {
      id: 'cinema_official',
      name: 'New Age Cinema 🎬',
      username: 'cinema_official',
      avatar: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80',
      online: true,
      verified: true,
      role: 'business',
      followersCount: 245000,
      followingCount: 15,
      postsCount: 420
    },
    thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    views: '4.1M просмотров',
    duration: '1 сезон • 8 серий',
    timeAgo: '1 неделю назад',
    likesCount: 240000,
    category: 'Сериалы',
    type: 'series',
    isSeries: true,
    rating: 8.9,
    ageRating: '16+',
    genre: 'Комедия, Драма, IT',
    releaseYear: 2024,
    description: 'Команда молодых разработчиков пытается запустить прорывной квантовый ИИ-стартап в сердце Кремниевой долины, сталкиваясь с безумными венчурными фондами и корпоративными гигантами.',
    seriesInfo: {
      seasonsCount: 3,
      episodesCount: 24,
      currentSeason: 1,
      currentEpisode: 1,
      episodes: [
        { id: 'ep1', title: '1. Алгоритм сингулярности', seasonNumber: 1, episodeNumber: 1, duration: '48 мин', thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=400&q=80' },
        { id: 'ep2', title: '2. Питч на миллиард', seasonNumber: 1, episodeNumber: 2, duration: '52 мин', thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=80' },
        { id: 'ep3', title: '3. Атака на сервера', seasonNumber: 1, episodeNumber: 3, duration: '45 мин', thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80' },
      ]
    },
    comments: [
      { id: 'cs1', user: initialUsers[2], text: 'Юмор про деплой в пятницу вечером — жизненно до слёз! Жду продолжения.', timeAgo: '2 дня назад', likes: 140 },
    ]
  },
  {
    id: 's2',
    title: 'Тьма и Квантовые Лабиринты: Тайна исчезновения во времени',
    channel: {
      id: 'cinema_official',
      name: 'New Age Cinema 🎬',
      username: 'cinema_official',
      avatar: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80',
      online: true,
      verified: true,
      role: 'business',
      followersCount: 245000,
      followingCount: 15,
      postsCount: 420
    },
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    views: '2.8M просмотров',
    duration: '2 сезона • 16 серий',
    timeAgo: '3 недели назад',
    likesCount: 198000,
    category: 'Сериалы',
    type: 'series',
    isSeries: true,
    rating: 8.7,
    ageRating: '18+',
    genre: 'Триллер, Фантастика, Детектив',
    releaseYear: 2023,
    description: 'В маленьком уединенном городке загадочно пропадают дети. Четыре семьи пытаются раскрыть правду и сталкиваются с временной аномалией, повторяющейся каждые 33 года.',
    seriesInfo: {
      seasonsCount: 2,
      episodesCount: 16,
      currentSeason: 1,
      currentEpisode: 1,
      episodes: [
        { id: 'ep4', title: '1. Пещера теней', seasonNumber: 1, episodeNumber: 1, duration: '56 мин', thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80' },
        { id: 'ep5', title: '2. Часовщик и петля', seasonNumber: 1, episodeNumber: 2, duration: '54 мин', thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80' },
      ]
    },
    comments: [
      { id: 'cs2', user: initialUsers[4], text: 'Сюжет продуман до мельчайших деталей! Поразительный сериал.', timeAgo: '4 дня назад', likes: 88 },
    ]
  },
  // ==================== РАЗДЕЛ: ИЗ ВАШИХ ПОДПИСОК ====================
  {
    id: 'sub1',
    title: 'UI/UX Дизайн тренды 2026: Неоморфизм, Глассморфизм и Микроанимации',
    channel: initialUsers[1], // Алиса Иванова (в подписках)
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    views: '54K просмотров',
    duration: '22:15',
    timeAgo: 'Вчера',
    likesCount: 3800,
    category: 'Дизайн',
    type: 'video',
    isFromSubscription: true,
    genre: 'Дизайн, Интерфейсы',
    description: 'Разбираем, как изменились визуальные стандарты сайтов и приложений: глубина, плавный свет, адаптивные микро-интеракции.',
    comments: [
      { id: 'csub1', user: currentUser, text: 'Очень полезно для нашего нового проекта, спасибо за разбор!', timeAgo: '3 часа назад', likes: 12 },
    ]
  },
  {
    id: 'sub2',
    title: 'Осознанность и медитация в ритме мегаполиса: Практический гид',
    channel: initialUsers[3], // Екатерина Смирнова
    thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    views: '32K просмотров',
    duration: '15:40',
    timeAgo: '2 дня назад',
    likesCount: 2900,
    category: 'Самопознание',
    type: 'video',
    isFromSubscription: true,
    genre: 'Медитация, Психология',
    description: 'Как сохранять внутренний баланс и ясность мысли в потоке ежедневных задач и дедлайнов.',
    comments: [
      { id: 'csub2', user: initialUsers[5], text: 'Техника дыхания из видео отлично помогает расслабиться вечером 🙏', timeAgo: '1 день назад', likes: 21 },
    ]
  }
];

// ==================== КЛИПЫ (ВЕРТИКАЛЬНЫЕ ВИДЕО / REELS) ====================

export const initialClips: Clip[] = [
  {
    id: 'clip_live_meditation',
    user: initialUsers[3], // Екатерина Смирнова
    poster: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    caption: 'ПРЯМОЙ ЭФИР: Вечерняя медитация тишины и снятия стресса 🕯️ Подключайтесь в круг спокойствия! Задавайте вопросы в прямой эфир.',
    musicTitle: 'Прямой эфир • Живой звук',
    musicAuthor: 'Екатерина Смирнова',
    audioTrackArt: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=100&q=80',
    isLive: true,
    viewersCount: 4280,
    likesCount: 18450,
    commentsCount: 924,
    sharesCount: 1820,
    viewsCount: 65400,
    isLiked: true,
    isSaved: false,
    tags: ['live', 'медитация', 'прямойэфир', 'осознанность'],
    timeAgo: 'В эфире',
    comments: [
      { id: 'c_l1', user: initialUsers[1], text: 'Какой тёплый голос! Очень помогает настроиться на сон ❤️', timeAgo: '1 мин назад', likes: 12 },
      { id: 'c_l2', user: initialUsers[2], text: 'Привет из Москвы! Дышим вместе 🙏', timeAgo: 'только что', likes: 5 },
      { id: 'c_l3', user: initialUsers[5], text: 'Энергетика через экран чувствуется!', timeAgo: 'только что', likes: 8 },
    ]
  },
  {
    id: 'clip_live_gaming',
    user: initialUsers[4], // Дмитрий Козлов
    poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    caption: 'LIVE СТРИМ: Турнирный финал по киберспорту 🏆 Обсуждаем тактики и общаемся со зрителями! Жмите сердечки!',
    musicTitle: 'Cyber Arena Live Sound',
    musicAuthor: 'Dmitry Tech',
    audioTrackArt: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=100&q=80',
    isLive: true,
    viewersCount: 8910,
    likesCount: 34100,
    commentsCount: 1450,
    sharesCount: 3900,
    viewsCount: 120400,
    isLiked: false,
    isSaved: false,
    tags: ['live', 'киберспорт', 'стрим', 'игры'],
    timeAgo: 'В эфире',
    comments: [
      { id: 'c_l4', user: initialUsers[6], text: 'Вот это камбэк в третьем раунде! 🔥', timeAgo: '2 мин назад', likes: 19 },
      { id: 'c_l5', user: initialUsers[7], text: 'Топим за победу!', timeAgo: '1 мин назад', likes: 7 },
    ]
  },
  {
    id: 'clip_soulhelp',
    user: {
      id: 'soulhelp_way',
      name: 'soulhelp.way',
      username: 'soulhelp.way',
      avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=150&q=80',
      online: true,
      verified: true,
      role: 'creator',
      bio: 'Путь пробуждения силы и осознанности.',
      consciousnessLevel: 12,
      consciousnessTitle: 'Мастер Пробуждения',
      followersCount: 18400,
      followingCount: 42,
      postsCount: 156
    },
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    caption: 'Как понять, что внутри тебя пробуждается древняя Сила? ⚡ Когда привычный мир вокруг перестает казаться устойчивым, а душа ищет глубинный смысл... #пробуждение #сила #духовность #осознанность',
    musicTitle: 'arya x • no sleep',
    musicAuthor: 'arya x',
    audioTrackArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80',
    overlayTitle: 'КАК ПОНЯТЬ, ЧТО ПРОБУЖДАЕТСЯ СИЛА?',
    isAiGenerated: true,
    likesCount: 2849,
    commentsCount: 129,
    sharesCount: 56,
    viewsCount: 48200,
    isLiked: false,
    isSaved: false,
    tags: ['пробуждение', 'сила', 'духовность', 'эзотерика', 'самопознание'],
    timeAgo: '4 ч назад',
    comments: [
      { id: 'c_sh1', user: initialUsers[2], text: 'В точку! Именно такие трансформации происходят прямо сейчас 🙏', timeAgo: '2 ч назад', likes: 42 },
      { id: 'c_sh2', user: initialUsers[4], text: 'Трек arya x идеально подчеркивает глубину атмосферы 🔥', timeAgo: '1 ч назад', likes: 18 },
      { id: 'c_sh3', user: initialUsers[1], text: 'Мурашки от слов и музыки. Благодарю за напоминание!', timeAgo: '35 мин назад', likes: 9 }
    ]
  },
  {
    id: 'clip_nature_ai',
    user: {
      id: 'mystic_nature',
      name: 'mystic.realm',
      username: 'mystic.realm',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      online: true,
      verified: true,
      role: 'creator',
      bio: 'ИИ-визуализация высших миров и тайн Вселенной.',
      consciousnessLevel: 9,
      consciousnessTitle: 'Квантовый Архитектор',
      followersCount: 29500,
      followingCount: 88,
      postsCount: 312
    },
    poster: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    caption: 'Портал в измерение света 🌌 Визуализировано нейросетью New Age AI в резонансе с космическими частотами. Какую энергию вы чувствуете?',
    musicTitle: 'Celestial Waves • 528 Hz Love Frequency',
    musicAuthor: 'Cosmic AI Harmonics',
    audioTrackArt: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=100&q=80',
    overlayTitle: 'КВАНТОВЫЙ РЕЗОНАНС СЕРДЦА',
    isAiGenerated: true,
    likesCount: 15420,
    commentsCount: 387,
    sharesCount: 1240,
    viewsCount: 94000,
    isLiked: true,
    isSaved: true,
    tags: ['ии', 'нейросеть', 'космос', 'вибрации', '528hz'],
    timeAgo: '7 ч назад',
    comments: [
      { id: 'c_m1', user: initialUsers[5], text: 'Невероятное качество графики и звука!', timeAgo: '5 ч назад', likes: 27 }
    ]
  },
  {
    id: 'clip_1',
    user: initialUsers[1],
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    caption: 'Морской прибой на закате 🌊 Когда ум успокаивается, открывается истинный взор. Практикуем тишину!',
    musicTitle: 'Медитация Океана • 432 Гц',
    musicAuthor: 'New Age Sound',
    audioTrackArt: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=100&q=80',
    likesCount: 14200,
    commentsCount: 384,
    sharesCount: 1250,
    viewsCount: 89000,
    isLiked: false,
    isSaved: false,
    tags: ['осознанность', 'море', 'клипы', 'медитация'],
    timeAgo: '2 ч назад',
    comments: [
      { id: 'cc1', user: initialUsers[2], text: 'Очень вдохновляющая атмосфера! Музыка в самое сердце 🙏', timeAgo: '1 ч назад', likes: 24 },
      { id: 'cc2', user: initialUsers[4], text: 'Звук волн невероятный, сразу снимает напряжение', timeAgo: '30 мин назад', likes: 11 },
      { id: 'cc3', user: initialUsers[6], text: 'Какой класс сознания нужен, чтобы так глубоко слышать природу? ✨', timeAgo: '15 мин назад', likes: 7 }
    ]
  },
  {
    id: 'clip_2',
    user: initialUsers[4],
    poster: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    caption: 'Горный хребет сквозь утренний туман 🏔️ Подъем на высоту 2500м. Тело дышит праной!',
    musicTitle: 'Дыхание Гор • Этническая флейта',
    musicAuthor: 'Алиса Смирнова',
    audioTrackArt: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=100&q=80',
    likesCount: 28900,
    commentsCount: 712,
    sharesCount: 3400,
    viewsCount: 174000,
    isLiked: true,
    isSaved: true,
    tags: ['горы', 'йога', 'пранаяма', 'путешествия'],
    timeAgo: '5 ч назад',
    comments: [
      { id: 'cc4', user: initialUsers[1], text: 'Вид просто завораживает! Красота мира бесконечна 🔥', timeAgo: '4 ч назад', likes: 52 },
      { id: 'cc5', user: initialUsers[5], text: 'На какой объектив снято? Плавность потрясающая!', timeAgo: '2 ч назад', likes: 19 }
    ]
  },
  {
    id: 'clip_3',
    user: initialUsers[6],
    poster: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    caption: 'Кодим алгоритм распределения заявок в девизе «Спасение служба» 💻 3% честная комиссия и открытый код!',
    musicTitle: 'Cyber Ambient • Synthwave Flow',
    musicAuthor: 'Dev Studio Music',
    audioTrackArt: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=100&q=80',
    likesCount: 9800,
    commentsCount: 245,
    sharesCount: 890,
    viewsCount: 65000,
    isLiked: false,
    isSaved: false,
    tags: ['код', 'разработка', 'спасениеслужба', 'стартап'],
    timeAgo: '1 день назад',
    comments: [
      { id: 'cc6', user: initialUsers[3], text: 'Вот это подход! Наконец-то прозрачная экосистема без грабительских комиссий 👏', timeAgo: '18 ч назад', likes: 45 },
      { id: 'cc7', user: initialUsers[7], text: 'Go + React в клипе выглядит мощно!', timeAgo: '12 ч назад', likes: 14 }
    ]
  },
  {
    id: 'clip_4',
    user: initialUsers[2],
    poster: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    caption: 'Звучание тибетской чаши в резонансе 528 Гц 🔔 Положите телефон, закройте глаза и сделайте 3 глубоких вдоха.',
    musicTitle: 'Поющая Чаша 528 Гц • ДНК исцеление',
    musicAuthor: 'Мастер Ананта',
    audioTrackArt: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=100&q=80',
    likesCount: 34100,
    commentsCount: 980,
    sharesCount: 5120,
    viewsCount: 220000,
    isLiked: true,
    isSaved: false,
    tags: ['саундхилинг', 'чаши', 'звук', 'покой'],
    timeAgo: '2 дня назад',
    comments: [
      { id: 'cc8', user: initialUsers[1], text: 'С мурашками по коже! Очень глубокая вибрация 💫', timeAgo: '1 день назад', likes: 88 }
    ]
  },
  {
    id: 'clip_5',
    user: initialUsers[5],
    poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    caption: 'Живой сет с винила на закате 🎧 Музыка объединяет сердца во всех уголках планеты!',
    musicTitle: 'Sunset Vinyl Sessions • Deep House',
    musicAuthor: 'DJ Sunset',
    audioTrackArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=100&q=80',
    likesCount: 18700,
    commentsCount: 420,
    sharesCount: 1980,
    viewsCount: 112000,
    isLiked: false,
    isSaved: true,
    tags: ['музыка', 'диджей', 'винил', 'вечер'],
    timeAgo: '3 дня назад',
    comments: [
      { id: 'cc9', user: initialUsers[4], text: 'Качает нереально! Где полный сет послушать?', timeAgo: '2 дня назад', likes: 30 }
    ]
  }
];

// ==================== ЧАТЫ (С МЕДИА, ГОЛОСОВЫМИ И ГРУППАМИ КОНФЕРЕНЦИЙ) ====================

export const initialChats: Chat[] = [
  {
    id: 'ai_guru_bot',
    user: {
      id: 'guru_ai',
      name: 'ИИ-Духовный Наставник (AI Guru)',
      username: 'guru_ai',
      avatar: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=150&q=80',
      online: true,
      verified: true,
      role: 'creator',
      bio: 'Персональный ИИ-советник по медитациям, картам Таро, астрологии и спокойствию ума.',
      followersCount: 14200,
      followingCount: 1,
      postsCount: 108
    },
    lastMessage: 'Мир твоему сердцу, путник. Что сейчас волнует твою душу? ✨',
    time: 'Только что',
    unread: 1,
    isPinned: true,
    isSystem: true,
    messages: [
      { id: 'm_guru_1', text: 'Мир твоему сердцу, путник. Я твой персональный ИИ-наставник по практикам и самопознанию.', fromMe: false, time: '12:00' },
      { id: 'm_guru_2', text: 'Ты можешь открыть 3D-колоду Таро, рассчитать натальную карту или начать совместную медитацию в Live Zen.', fromMe: false, time: '12:01' },
      { id: 'm_guru_3', text: 'Как твое внутреннее состояние прямо сейчас? ✨', fromMe: false, time: '12:02' }
    ]
  },
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
    isFavorite: true,
    tagId: 'new_client',
    messages: [
      { id: 'm1', text: 'Привет, Алексей! 👋', fromMe: false, time: '12:30' },
      { 
        id: 'm2', 
        text: 'Привет, Алиса! Всё отлично, обновляем дизайн мессенджера.', 
        fromMe: true, 
        time: '12:32', 
        status: 'read',
        reactions: [{ emoji: '❤️', count: 1, fromMe: true }]
      },
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
        text: 'Вот новые макеты с прикреплением файлов!',
        status: 'delivered',
        reactions: [{ emoji: '🔥', count: 2, fromMe: false }]
      },
      { id: 'm5', text: 'Слушай, а голосовые сообщения теперь тоже можно отправлять? 🎙️', fromMe: false, time: '12:45' },
    ],
  },
  {
    id: 'ch2',
    user: initialUsers[2],
    isImportant: true,
    tagId: 'order_completed',
    lastMessage: 'Подключись в закрытую конференцию по ссылке в 16:00',
    time: '11:20',
    unread: 0,
    messages: [
      { id: 'm6', text: 'Привет! Готов к сегодняшнему синку?', fromMe: true, time: '10:00', status: 'read' },
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
      { id: 'm9', text: 'Екатерина, взгляни пожалуйста на новые карточки профиля.', fromMe: true, time: 'Вчера', status: 'sent' },
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

