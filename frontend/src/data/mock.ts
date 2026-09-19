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

export interface StoryViewerUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  viewedAt?: string;
  liked?: boolean;
  isFollower?: boolean;
}

export interface StoryStats {
  viewsCount: number;
  followersPercent: number;
  nonFollowersPercent: number;
  uniqueViewersCount: number;
  interactionsCount: number;
  storyInteractionsCount: number;
  likesCount: number;
  sharesCount: number;
  repliesCount: number;
  engagedAccountsCount?: number | string;
  navigationTotal: number;
  navigationForward: number;
  navigationExits: number;
  navigationNext: number;
  profileActions: number;
  profileVisits: number;
  linkClicks: number;
  companyAddressClicks: number;
  followsCount: number;
  viewers: StoryViewerUser[];
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
  stats?: StoryStats;
  viewsCount?: number;
  musicTrack?: string;
  reelsSourceTitle?: string;
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

// ==================== ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ (по умолчанию — гость) ====================

export const currentUser: User = {
  id: 'guest',
  name: 'Гость',
  username: 'guest',
  avatar: '',
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  role: 'user',
};

// ==================== ДАННЫЕ (загружаются с сервера) ====================

export const initialUsers: User[] = [];
export const stories: Story[] = [];
export const posts: Post[] = [];
export const videos: Video[] = [];
export const initialClips: Clip[] = [];
export const initialChats: Chat[] = [];
export const chats: Chat[] = initialChats;
export const initialConferences: Conference[] = [];
export const initialRecordings: Conference[] = [];
export const podcasts: Podcast[] = [];
export const conferenceParticipants: User[] = [];
export const initialConferenceMessages: ConferenceMessage[] = [];
export const initialProducts: Product[] = [];
export const initialCommunities: Community[] = [];
export const initialTransactions: WalletTransaction[] = [];
export const initialSubscriptionTiers: SubscriptionTier[] = [];
