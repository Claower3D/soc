// ==================== РўРРџР« ====================

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
    name: 'РҐСЂРёСЃС‚РёР°РЅСЃС‚РІРѕ',
    symbolTitle: 'РљСЂРµСЃС‚',
    iconImg: '/symbols/christianity.jpg',
    description: 'Р’РµСЂР° РІ РРёСЃСѓСЃР° РҐСЂРёСЃС‚Р°, Р»СЋР±РѕРІСЊ Рє Р±Р»РёР¶РЅРµРјСѓ Рё СЃРїР°СЃРµРЅРёРµ'
  },
  {
    id: 'islam',
    name: 'РСЃР»Р°Рј',
    symbolTitle: 'РџРѕР»СѓРјРµСЃСЏС† Рё Р—РІРµР·РґР°',
    iconImg: '/symbols/islam.jpg',
    description: 'Р•РґРёРЅРѕР±РѕР¶РёРµ (РўР°СѓС…РёРґ), СЃР»РµРґРѕРІР°РЅРёРµ РљРѕСЂР°РЅСѓ Рё РЎСѓРЅРЅРµ'
  },
  {
    id: 'judaism',
    name: 'РСѓРґР°РёР·Рј',
    symbolTitle: 'Р—РІРµР·РґР° Р”Р°РІРёРґР° (РњР°РіРµРЅ Р”Р°РІРёРґ)',
    iconImg: '/symbols/judaism.jpg',
    description: 'Р—Р°РІРµС‚ СЃ Р’СЃРµРІС‹С€РЅРёРј, РўРѕСЂР°, СЌС‚РёС‡РµСЃРєРёР№ РјРѕРЅРѕС‚РµРёР·Рј'
  },
  {
    id: 'hinduism',
    name: 'РРЅРґСѓРёР·Рј',
    symbolTitle: 'РћРј (РђСѓРј)',
    iconImg: '/symbols/hinduism.jpg',
    description: 'Р”С…Р°СЂРјР°, РєР°СЂРјР°, СЃР°РЅСЃР°СЂР°, РјРѕРєС€Р° Рё СЃР°РєСЂР°Р»СЊРЅС‹Р№ Р·РІСѓРє РћРј'
  },
  {
    id: 'buddhism',
    name: 'Р‘СѓРґРґРёР·Рј',
    symbolTitle: 'РљРѕР»РµСЃРѕ Р”С…Р°СЂРјС‹ (Р”С…Р°СЂРјР°С‡Р°РєСЂР°)',
    iconImg: '/symbols/buddhism.jpg',
    description: 'Р‘Р»Р°РіРѕСЂРѕРґРЅС‹Р№ РІРѕСЃСЊРјРµСЂРёС‡РЅС‹Р№ РїСѓС‚СЊ, РѕСЃРѕР·РЅР°РЅРЅРѕСЃС‚СЊ Рё РїСЂРѕСЃРІРµС‚Р»РµРЅРёРµ'
  },
  {
    id: 'taoism',
    name: 'Р”Р°РѕСЃРёР·Рј',
    symbolTitle: 'РРЅСЊ-РЇРЅ',
    iconImg: '/symbols/taoism.jpg',
    description: 'РџСѓС‚СЊ Р”Р°Рѕ, РіР°СЂРјРѕРЅРёСЏ РїСЂРѕС‚РёРІРѕРїРѕР»РѕР¶РЅРѕСЃС‚РµР№ Рё РµСЃС‚РµСЃС‚РІРµРЅРЅРѕСЃС‚СЊ'
  },
  {
    id: 'shinto',
    name: 'РЎРёРЅС‚РѕРёР·Рј',
    symbolTitle: 'РўРѕСЂРёРё',
    iconImg: '/symbols/shinto.jpg',
    description: 'РџРѕС‡РёС‚Р°РЅРёРµ РґСѓС…РѕРІ РїСЂРёСЂРѕРґС‹ (РљР°РјРё), С‡РёСЃС‚РѕС‚Р° Рё РіР°СЂРјРѕРЅРёСЏ'
  },
  {
    id: 'jainism',
    name: 'Р”Р¶Р°Р№РЅРёР·Рј',
    symbolTitle: 'РђС…РёРјСЃР° (Р СѓРєР°)',
    iconImg: '/symbols/jainism.jpg',
    description: 'РќРµРЅР°СЃРёР»РёРµ (РђС…РёРјСЃР°), СЃР°РјРѕРґРёСЃС†РёРїР»РёРЅР° Рё СѓРІР°Р¶РµРЅРёРµ Рє Р¶РёР·РЅРё'
  },
  {
    id: 'sikhism',
    name: 'РЎРёРєС…РёР·Рј',
    symbolTitle: 'РљС…Р°РЅРґР°',
    iconImg: '/symbols/sikhism.jpg',
    description: 'РЎР»СѓР¶РµРЅРёРµ Р»СЋРґСЏРј, СЂР°РІРµРЅСЃС‚РІРѕ, С‡РµСЃС‚РЅРѕСЃС‚СЊ Рё РјРµРґРёС‚Р°С†РёСЏ РЅР° РРјСЏ Р‘РѕРіР°'
  },
  {
    id: 'zoroastrianism',
    name: 'Р—РѕСЂРѕР°СЃС‚СЂРёР·Рј',
    symbolTitle: 'Р¤Р°СЂР°РІР°С…Р°СЂ',
    iconImg: '/symbols/zoroastrianism.jpg',
    description: 'Р‘Р»Р°РіРёРµ РјС‹СЃР»Рё, Р±Р»Р°РіРёРµ СЃР»РѕРІР°, Р±Р»Р°РіРёРµ РґРµСЏРЅРёСЏ'
  },
  {
    id: 'ayyavazhi',
    name: 'РђР№СЏРІР°Р¶Рё',
    symbolTitle: 'Р›РѕРІРµС† Р—Р»Р° (РќР°РјР°)',
    iconImg: '/symbols/ayyavazhi.jpg',
    description: 'РџРѕР±РµРґР° СЃРІРµС‚Р° РЅР°Рґ С‚СЊРјРѕР№ Рё РґСѓС…РѕРІРЅРѕРµ РµРґРёРЅСЃС‚РІРѕ'
  },
  {
    id: 'humanism',
    name: 'Р“СѓРјР°РЅРёР·Рј / РЎРІРµС‚СЃРєРёР№ С‡РµР»РѕРІРµРє',
    symbolTitle: 'РЎС‡Р°СЃС‚Р»РёРІС‹Р№ Р§РµР»РѕРІРµРє',
    iconImg: '/symbols/humanism.jpg',
    description: 'Р§РµР»РѕРІРµРє, РЅР°СѓРєР°, СЂР°Р·СѓРј, СЃРѕР·РёРґР°РЅРёРµ Рё СЃРІРѕР±РѕРґР° СЃРѕРІРµСЃС‚Рё'
  },
  {
    id: 'none',
    name: 'РќРµ СѓРєР°Р·С‹РІР°С‚СЊ / Р›РёС‡РЅРѕРµ',
    symbolTitle: 'РЎРєСЂС‹С‚Рѕ',
    iconImg: '',
    description: 'РџСЂРµРґРїРѕС‡РёС‚Р°СЋ РЅРµ СѓРєР°Р·С‹РІР°С‚СЊ РјРёСЂРѕРІРѕР·Р·СЂРµРЅРёРµ'
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
  friendsCount?: number;
  clipsCount?: number;
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
  consciousnessLevel?: number; // РљР»Р°СЃСЃ СЃРѕР·РЅР°РЅРёСЏ РѕС‚ 1 РґРѕ 11
  consciousnessTitle?: string; // РќР°Р·РІР°РЅРёРµ РєР»Р°СЃСЃР° СЃРѕР·РЅР°РЅРёСЏ
  cognitionVector?: 'spiritual' | 'exact_sciences' | 'visual_analogies' | 'philosophical' | 'pragmatic'; // Р’РµРєС‚РѕСЂ РІРѕСЃРїСЂРёСЏС‚РёСЏ
  birthDate?: string; // Р”Р°С‚Р° СЂРѕР¶РґРµРЅРёСЏ (Р“Р“Р“Р“-РњРњ-Р”Р”)
  zodiacSign?: string; // Р—РЅР°Рє Р·РѕРґРёР°РєР° (РћРІРµРЅ, РўРµР»РµС†...)
  easternZodiac?: string; // Р’РѕСЃС‚РѕС‡РЅС‹Р№ Р·РЅР°Рє (Р”СЂР°РєРѕРЅ, РўРёРіСЂ...)
  gender?: 'male' | 'female' | 'other' | 'hidden'; // РџРѕР»
  showBirthDate?: boolean; // РџРѕРєР°Р·С‹РІР°С‚СЊ РґР°С‚Сѓ СЂРѕР¶РґРµРЅРёСЏ
  showZodiac?: boolean; // РџРѕРєР°Р·С‹РІР°С‚СЊ Р·РЅР°Рє Р·РѕРґРёР°РєР°
  isPremium?: boolean; // New Age Premium РїРѕРґРїРёСЃРєР°
  premiumSince?: string; // Р”Р°С‚Р° РѕС„РѕСЂРјР»РµРЅРёСЏ Premium
  phone_number?: string; // РќРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°
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
  rating?: number; // Р РµР№С‚РёРЅРі РљРёРЅРѕРїРѕРёСЃРє/IMDb РґР»СЏ С„РёР»СЊРјРѕРІ Рё СЃРµСЂРёР°Р»РѕРІ (e.g. 8.4)
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
  mediaType?: 'image' | 'video' | 'voice' | 'file' | 'video_note' | 'poll' | 'event' | 'product' | 'contact' | 'sticker' | 'gif' | 'audio' | 'document';
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
  replyToId?: string;
  replyToText?: string;
}

export interface ChatTag {
  id: string;
  title: string;
  color: string;
}

export const CHAT_TAGS: ChatTag[] = [
  { id: 'new_client', title: 'РќРѕРІС‹Р№ РєР»РёРµРЅС‚', color: '#3B82F6' },
  { id: 'order_completed', title: 'Р—Р°РєР°Р· РІС‹РїРѕР»РЅРµРЅ', color: '#10B981' },
  { id: 'in_progress', title: 'Р’ СЂР°Р±РѕС‚Рµ', color: '#F59E0B' },
  { id: 'payment_waiting', title: 'РћР¶РёРґР°РµС‚ РѕРїР»Р°С‚С‹', color: '#EC4899' },
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
    name: 'РљР»Р°СЃСЃРёС‡РµСЃРєР°СЏ',
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
    name: 'РљРѕСЃРјРёС‡РµСЃРєРёР№ Zen',
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
    name: 'РќРµРѕРЅ & РљРёР±РµСЂРїР°РЅРє',
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
    name: 'РР·СѓРјСЂСѓРґРЅС‹Р№ РћР°Р·РёСЃ',
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
    name: 'РЎРѕР»РЅРµС‡РЅС‹Р№ Р—Р°РєР°С‚',
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
    name: 'РўРµРјРЅС‹Р№ РњРёРЅРёРјР°Р»РёР·Рј',
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
  isPrivate: boolean; // true = С‚РѕР»СЊРєРѕ РїРѕ СЃСЃС‹Р»РєРµ рџ”’, false = РѕС‚РєСЂС‹С‚Р°СЏ рџЊђ
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

// ==================== РњРђР РљР•РўРџР›Р•Р™РЎ ====================

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

// ==================== РЎРћРћР‘Р©Р•РЎРўР’Рђ ====================

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

// ==================== РљРћРЁР•Р›Р•Рљ Р РџРћР”РџРРЎРљР ====================

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

// ==================== РўР•РљРЈР©РР™ РџРћР›Р¬Р—РћР’РђРўР•Р›Р¬ (РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ вЂ” РіРѕСЃС‚СЊ) ====================

export const currentUser: User = {
  id: 'guest',
  name: 'Р“РѕСЃС‚СЊ',
  username: 'guest',
  avatar: '',
  followersCount: 0,
  followingCount: 0,
  postsCount: 0,
  role: 'user',
};

// ==================== Р”РђРќРќР«Р• (Р·Р°РіСЂСѓР¶Р°СЋС‚СЃСЏ СЃ СЃРµСЂРІРµСЂР°) ====================

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

