// ==================== ТИПЫ ====================

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
  postsCount: number;
  highlights?: Highlight[];
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
  postsCount: 24,
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
