export interface MeditationTrack {
  id: string;
  title: string;
  category: string;
  durationMin: number;
  description: string;
  bgGradient: string;
  frequencyLabel: string;
  soundType: 'bowl' | '432' | '528' | 'rain' | 'waves';
}

export interface YogaPose {
  name: string;
  sanskritName: string;
  durationSec: number;
  description: string;
  benefit: string;
  breathing: string;
  chakra: string;
}

export interface YogaRoutine {
  id: string;
  title: string;
  subtitle: string;
  level: 'Начинающий' | 'Средний' | 'Все уровни';
  durationMin: number;
  caloriesBurn: number;
  category: 'Утро' | 'Стресс' | 'Сила' | 'Вечер' | 'Энергия';
  bgGradient: string;
  description: string;
  poses: YogaPose[];
}

export interface Affirmation {
  id: string;
  text: string;
  category: 'harmony' | 'abundance' | 'self-love' | 'power' | 'health';
  categoryLabel: string;
  author?: string;
}

export interface BreathingTechnique {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  holdAfterExhaleSec: number;
  purpose: string;
}

export interface WisdomQuote {
  id: string;
  text: string;
  author: string;
  tradition: string;
}

export const MEDITATION_TRACKS: MeditationTrack[] = [
  {
    id: 'deep-peace',
    title: 'Глубокий внутренний покой',
    category: 'Осознанность',
    durationMin: 10,
    description: 'Мягкое погружение в состояние наблюдателя, отпускание тревожных мыслей и напряжения в теле.',
    bgGradient: 'linear-gradient(135deg, #4F46E5, #06B6D4)',
    frequencyLabel: 'Частота 432 Гц',
    soundType: '432'
  },
  {
    id: 'tibetan-mindfulness',
    title: 'Тибетские поющие чаши',
    category: 'Звуковая терапия',
    durationMin: 15,
    description: 'Гармонизирующий резонанс аутентичных кованых чаш для выравнивания энергетических центров.',
    bgGradient: 'linear-gradient(135deg, #D97706, #B45309)',
    frequencyLabel: 'Частота Земли',
    soundType: 'bowl'
  },
  {
    id: 'transformation-528',
    title: 'Исцеление и обновление',
    category: 'Трансформация',
    durationMin: 20,
    description: 'Вибрация золотого сечения 528 Гц, способствующая клеточному обновлению и душевному равновесию.',
    bgGradient: 'linear-gradient(135deg, #059669, #10B981)',
    frequencyLabel: 'Частота 528 Гц (ДНК)',
    soundType: '528'
  },
  {
    id: 'rain-zen',
    title: 'Медитация под тёплым дождём',
    category: 'Природный эмбиент',
    durationMin: 15,
    description: 'Шум капель, смывающий усталость дня, восстанавливающий ясность ума и лёгкость дыхания.',
    bgGradient: 'linear-gradient(135deg, #2563EB, #38BDF8)',
    frequencyLabel: 'Розовый шум дождя',
    soundType: 'rain'
  },
  {
    id: 'ocean-calm',
    title: 'Океан тишины и безмятежности',
    category: 'Снятие стресса',
    durationMin: 12,
    description: 'Ритмичные волны прибоя, синхронизирующие сердечный ритм с пульсом океана.',
    bgGradient: 'linear-gradient(135deg, #0284C7, #0D9488)',
    frequencyLabel: 'Волны 0.1 Гц',
    soundType: 'waves'
  }
];

export const YOGA_ROUTINES: YogaRoutine[] = [
  {
    id: 'surya-namaskar',
    title: 'Сурья Намаскар (Приветствие Солнцу)',
    subtitle: 'Классический цикл пробуждения жизненной праны',
    level: 'Все уровни',
    durationMin: 15,
    caloriesBurn: 110,
    category: 'Утро',
    bgGradient: 'linear-gradient(135deg, #F59E0B, #EA580C)',
    description: 'Древнейшая практика йоги, запускающая метаболизм, вытягивающая позвоночник и наполняющая созидательной энергией на весь день.',
    poses: [
      {
        name: 'Молитвенная поза',
        sanskritName: 'Пранамасана',
        durationSec: 30,
        description: 'Встаньте ровно, стопы вместе. Ладони соединены перед грудью в жесте Анджали Мудра. Закройте глаза и настройтесь на солнечный свет.',
        benefit: 'Центрирование ума, выравнивание осанки',
        breathing: 'Спокойный вдох и полный выдох',
        chakra: 'Анахата (Сердечная)'
      },
      {
        name: 'Поза с поднятыми руками',
        sanskritName: 'Хаста Уттанасана',
        durationSec: 30,
        description: 'На вдохе поднимите руки вверх, мягко прогнитесь назад от грудного отдела. Взгляд направлен вверх.',
        benefit: 'Раскрытие грудной клетки, стимуляция щитовидной железы',
        breathing: 'Глубокий вдох через нос',
        chakra: 'Вишудха (Горловая)'
      },
      {
        name: 'Наклон к стопам',
        sanskritName: 'Падахастасана',
        durationSec: 45,
        description: 'На выдохе плавно опуститесь корпусом вниз от тазобедренных суставов. Колени можно чуть присогнуть, шея расслаблена.',
        benefit: 'Вытяжение задней поверхности бёдер и позвоночника',
        breathing: 'Плавный мягкий выдох',
        chakra: 'Свадхистана'
      },
      {
        name: 'Поза всадника',
        sanskritName: 'Ашва Санчаланасана',
        durationSec: 45,
        description: 'Шагните правой ногой далеко назад, опустите правое колено на коврик. Грудная клетка раскрыта вперед и вверх.',
        benefit: 'Раскрытие таза, укрепление связок',
        breathing: 'Вдох с раскрытием груди',
        chakra: 'Муладхара'
      },
      {
        name: 'Планка (Посох)',
        sanskritName: 'Кумбхакасана',
        durationSec: 45,
        description: 'Удерживайте тело на одной прямой линии. Мышцы кора и бёдер в тонусе, ладони строго под плечами.',
        benefit: 'Укрепление мышц кора, рук и спины',
        breathing: 'Ровное, непрерывное дыхание',
        chakra: 'Манипура'
      },
      {
        name: 'Собака мордой вниз',
        sanskritName: 'Адхо Мукха Шванасана',
        durationSec: 60,
        description: 'Толкайте таз вверх и назад, создавая телом треугольник. Пятки тянутся к полу, спина прямая, плечи отведены от ушей.',
        benefit: 'Снятие усталости, прилив крови к мозгу',
        breathing: 'Глубокое диафрагмальное дыхание',
        chakra: 'Сахасрара'
      }
    ]
  },
  {
    id: 'stress-relief',
    title: 'Антистресс и снятие зажимов',
    subtitle: 'Мягкая восстановительная терапия для спины и шеи',
    level: 'Начинающий',
    durationMin: 20,
    caloriesBurn: 85,
    category: 'Стресс',
    bgGradient: 'linear-gradient(135deg, #10B981, #0D9488)',
    description: 'Идеальный комплекс после сидячего рабочего дня: мягко снимает спазмы трапеции, раскрывает диафрагму и нормализует давление.',
    poses: [
      {
        name: 'Поза ребёнка',
        sanskritName: 'Баласана',
        durationSec: 60,
        description: 'Сядьте на пятки, разведите колени, опустите лоб на коврик и вытяните руки вперед. Позвольте телу полностью отпустить напряжение.',
        benefit: 'Мгновенное успокоение нервной системы, вытяжение крестца',
        breathing: 'Медленное брюшное дыхание',
        chakra: 'Аджна (Третий глаз)'
      },
      {
        name: 'Кошка-Корова',
        sanskritName: 'Марджариасана - Битиласана',
        durationSec: 60,
        description: 'На вдохе мягко прогибайте спину, поднимая подбородок. На выдохе скругляйте спину, подтягивая подбородок к ключицам.',
        benefit: 'Подвижность каждого позвонка, лимфодренаж',
        breathing: 'Синхронно с движением',
        chakra: 'Анахата и Свадхистана'
      },
      {
        name: 'Поза голубя',
        sanskritName: 'Эка Пада Раджакапотасана (модификация)',
        durationSec: 60,
        description: 'Согните правое колено перед собой, левую ногу вытяните назад. Опуститесь на предплечья для глубокого расслабления таза.',
        benefit: 'Освобождение от накопленных эмоций и зажимов седалищного нерва',
        breathing: 'Вдох в зону натяжения, выдох — отпускание',
        chakra: 'Свадхистана'
      }
    ]
  },
  {
    id: 'evening-nidra',
    title: 'Вечерняя Йога-Нидра',
    subtitle: 'Погружение в осознанный глубокий сон',
    level: 'Все уровни',
    durationMin: 25,
    caloriesBurn: 40,
    category: 'Вечер',
    bgGradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    description: 'Психический сон йогов: расслабление слоёв тела (кош), очищение подсознания от дневного инфошума и подготовка ко сну.',
    poses: [
      {
        name: 'Поза бабочки лёжа',
        sanskritName: 'Супта Баддха Конасана',
        durationSec: 90,
        description: 'Лягте на спину, соедините стопы вместе, колени мягко падают в стороны. Руки лежат ладонями вверх вдоль тела.',
        benefit: 'Снятие застоя в малом тазу, гармонизация нервной системы',
        breathing: 'Полное дыхание йогов',
        chakra: 'Свадхистана'
      },
      {
        name: 'Скручивание лёжа',
        sanskritName: 'Супта Матсиендрасана',
        durationSec: 60,
        description: 'Лёжа на спине, согните правое колено и уведите его влево. Голова поворачивается вправо. Лопатки плотно прижаты к полу.',
        benefit: 'Декомпрессия поясничного отдела, стимуляция пищеварения',
        breathing: 'Мягкий долгий выдох',
        chakra: 'Манипура'
      },
      {
        name: 'Шавасана (Поза полного покоя)',
        sanskritName: 'Шавасана',
        durationSec: 180,
        description: 'Полное неподвижное расслабление на спине. Мышцы лица, глазные яблоки, пальцы рук и ног абсолютно расслаблены.',
        benefit: 'Интеграция эффекта практики, клеточная регенерация',
        breathing: 'Естественное, едва уловимое дыхание',
        chakra: 'Сахасрара'
      }
    ]
  }
];

export const INITIAL_AFFIRMATIONS: Affirmation[] = [
  {
    id: 'aff-1',
    category: 'harmony',
    categoryLabel: 'Гармония и покой',
    text: 'Мой ум спокоен, сердце открыто, а душа находится в абсолютном созвучии со Вселенной.'
  },
  {
    id: 'aff-2',
    category: 'harmony',
    categoryLabel: 'Гармония и покой',
    text: 'Я отпускаю контроль и с доверием принимаю естественный поток жизненных событий.'
  },
  {
    id: 'aff-3',
    category: 'abundance',
    categoryLabel: 'Изобилие и поток',
    text: 'Я являюсь чистым проводником изобилия. Блага и возможности приходят ко мне легко и своевременно.'
  },
  {
    id: 'aff-4',
    category: 'abundance',
    categoryLabel: 'Изобилие и поток',
    text: 'Вселенная неисчерпаема, и всё, что предназначено для моего роста, уже стремится навстречу мне.'
  },
  {
    id: 'aff-5',
    category: 'self-love',
    categoryLabel: 'Любовь и принятие',
    text: 'Я безусловно люблю и принимаю себя во всех проявлениях. Моя уникальность — это священный дар.'
  },
  {
    id: 'aff-6',
    category: 'self-love',
    categoryLabel: 'Любовь и принятие',
    text: 'Я достоин самого светлого, искреннего счастья и окружаю себя поддерживающими людьми.'
  },
  {
    id: 'aff-7',
    category: 'power',
    categoryLabel: 'Сила духа и воля',
    text: 'Во мне живёт несокрушимая внутренняя опора. Любое испытание делает мой дух чище и сильнее.'
  },
  {
    id: 'aff-8',
    category: 'power',
    categoryLabel: 'Сила духа и воля',
    text: 'Я ясно вижу свои цели и двигаюсь к ним со спокойной уверенностью и благодарностью.'
  },
  {
    id: 'aff-9',
    category: 'health',
    categoryLabel: 'Здоровье и энергия',
    text: 'Каждая клетка моего тела наполнена светом, жизненной силой и природным здоровьем.'
  },
  {
    id: 'aff-10',
    category: 'health',
    categoryLabel: 'Здоровье и энергия',
    text: 'Я бережно отношусь к своему телу, оно отвечает мне молодостью, лёгкостью и бодростью.'
  }
];

export const BREATHING_TECHNIQUES: BreathingTechnique[] = [
  {
    id: '4-7-8',
    title: 'Техника 4-7-8 (Глубокий релакс)',
    subtitle: 'Антитревожное парасимпатическое дыхание',
    description: 'Активирует блуждающий нерв (vagus nerve), замедляет частоту сердечных сокращений и погружает в спокойствие.',
    inhaleSec: 4,
    holdSec: 7,
    exhaleSec: 8,
    holdAfterExhaleSec: 0,
    purpose: 'Быстрое снятие паники, подготовка ко сну, умиротворение'
  },
  {
    id: 'square',
    title: 'Квадратное дыхание (Самавритти)',
    subtitle: 'Баланс, фокус и кристальная ясность',
    description: 'Древняя техника спецслужб и йогов: четыре равные фазы восстанавливают контроль над вниманием и эмоциями.',
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 4,
    holdAfterExhaleSec: 4,
    purpose: 'Концентрация перед важными делами, ясность мышления'
  },
  {
    id: 'relax-4-6',
    title: 'Дыхание 4-6 (Мягкое успокоение)',
    subtitle: 'Оптимальный ритм для медитации',
    description: 'Выдох длиннее вдоха на полтора раза — классическая пропорция для мягкого расслабления без задержек дыхания.',
    inhaleSec: 4,
    holdSec: 0,
    exhaleSec: 6,
    holdAfterExhaleSec: 0,
    purpose: 'Снижение стресса в течение дня, комфортно для новичков'
  }
];

export const AMBIENT_SOUNDS = [
  { id: 'tone-432', title: 'Частота 432 Гц', subtitle: 'Гармония природы', freq: 432, type: 'tone' as const },
  { id: 'tone-528', title: 'Частота 528 Гц', subtitle: 'Трансформация и любовь', freq: 528, type: 'tone' as const },
  { id: 'tone-om', title: 'Вибрация Ом (108 Гц)', subtitle: 'Корневое заземление', freq: 108, type: 'tone' as const },
  { id: 'noise-rain', title: 'Дзен-дождь', subtitle: 'Розовый природный шум', filter: 'lowpass' as const, cutoff: 1400, type: 'noise' as const },
  { id: 'noise-ocean', title: 'Океанский бриз', subtitle: 'Мягкий прилив', filter: 'bandpass' as const, cutoff: 700, type: 'noise' as const },
  { id: 'noise-stream', title: 'Горный ручей', subtitle: 'Прохлада и свежесть', filter: 'highpass' as const, cutoff: 900, type: 'noise' as const }
];

export const WISDOM_QUOTES: WisdomQuote[] = [
  {
    id: 'w-1',
    text: 'Тот, кто побеждает других — силён; тот, кто побеждает себя — воистину могущественен.',
    author: 'Лао-цзы',
    tradition: 'Даосизм'
  },
  {
    id: 'w-2',
    text: 'Мир приходит изнутри. Не ищи его снаружи.',
    author: 'Будда Шакьямуни',
    tradition: 'Буддизм'
  },
  {
    id: 'w-3',
    text: 'Тишина — это язык Бога, всё остальное — лишь плохой перевод.',
    author: 'Джалаладдин Руми',
    tradition: 'Суфизм'
  },
  {
    id: 'w-4',
    text: 'Ты имеешь власть над своим разумом, а не над внешними событиями. Осознай это, и ты обретёшь силу.',
    author: 'Марк Аврелий',
    tradition: 'Стоицизм'
  },
  {
    id: 'w-5',
    text: 'Йога есть успокоение колебаний ума (Читта Вритти Ниродха).',
    author: 'Патанджали',
    tradition: 'Йога-сутры'
  },
  {
    id: 'w-6',
    text: 'Когда чаша полна, в неё ничего нельзя налить. Опустоши свой ум, чтобы постичь истину.',
    author: 'Дзенская притча',
    tradition: 'Дзен'
  }
];

export type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'KZT' | 'UAH' | 'AED' | 'CNY' | 'USDT' | 'AGE';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToRub: number; // 1 unit of currency = X RUB
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  RUB: { code: 'RUB', symbol: '₽', name: 'Рубль (RUB)', rateToRub: 1 },
  USD: { code: 'USD', symbol: '$', name: 'Доллар (USD)', rateToRub: 92 },
  EUR: { code: 'EUR', symbol: '€', name: 'Евро (EUR)', rateToRub: 100 },
  KZT: { code: 'KZT', symbol: '₸', name: 'Тенге (KZT)', rateToRub: 0.20 },
  UAH: { code: 'UAH', symbol: '₴', name: 'Гривна (UAH)', rateToRub: 2.25 },
  AED: { code: 'AED', symbol: 'AED', name: 'Дирхам (AED)', rateToRub: 25 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Юань (CNY)', rateToRub: 12.8 },
  USDT: { code: 'USDT', symbol: '₮', name: 'Tether (USDT)', rateToRub: 92 },
  AGE: { code: 'AGE', symbol: '🪙 AGE', name: 'New Age Token', rateToRub: 10 }
};

export function convertPrice(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount;
  const rubVal = amount * CURRENCIES[from].rateToRub;
  const targetVal = rubVal / CURRENCIES[to].rateToRub;
  
  if (to === 'USD' || to === 'EUR' || to === 'USDT') {
    return Math.round(targetVal);
  }
  if (to === 'KZT' || to === 'RUB' || to === 'UAH' || to === 'AED' || to === 'CNY' || to === 'AGE') {
    return Math.round(targetVal / 10) * 10;
  }
  return Math.round(targetVal);
}

export function formatPrice(amount: number, currency: CurrencyCode): string {
  const formatted = Math.round(amount).toLocaleString('ru-RU');
  const conf = CURRENCIES[currency];
  if (currency === 'USD') return `$${formatted}`;
  if (currency === 'EUR') return `€${formatted}`;
  if (currency === 'USDT') return `${formatted} ₮`;
  if (currency === 'AGE') return `${formatted} 🪙 AGE`;
  return `${formatted} ${conf.symbol}`;
}

export interface SpiritualCourse {
  id: string;
  title: string;
  subtitle: string;
  category: 'yoga' | 'meditation' | 'affirmations' | 'breathing' | 'soundhealing' | 'retreats';
  categoryLabel: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  authorVerified: boolean;
  rating: number;
  studentsCount: number;
  lessonsCount: number;
  durationLabel: string;
  format: 'Видеокурс' | 'Интенсив' | 'Наставничество' | 'Ретрит';
  description: string;
  highlights: string[];
  basePrice: number;
  baseCurrency: CurrencyCode;
  discountPercent?: number;
  isSponsored?: boolean;
  sponsoredPlacement?: ('yoga' | 'meditation' | 'affirmations' | 'breathing' | 'soundhealing' | 'retreats' | 'all')[];
  badgeLabel?: string;
  bgGradient: string;
}

export const INITIAL_COURSES: SpiritualCourse[] = [
  {
    id: 'course-yoga-ashtanga',
    title: 'Аштанга-Виньяса и Энергетические Замки (Бандхи)',
    subtitle: 'Полный фундаментальный курс раскрытия силы, гибкости и пранических каналов',
    category: 'yoga',
    categoryLabel: 'Йога и Прана',
    authorName: 'Сурьянанда Дев',
    authorRole: 'Гранд-мастер йоги, 18 лет практики в Ришикеше',
    authorAvatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=150&auto=format&fit=crop&q=80',
    authorVerified: true,
    rating: 4.98,
    studentsCount: 1420,
    lessonsCount: 24,
    durationLabel: '6 недель • 24 урока',
    format: 'Видеокурс',
    description: 'Глубокое погружение в первую серию Аштанга-йоги. Освоение дыхания Удджайи, мышечных замков Мула и Уддияна Бандха, травмобезопасные отстройки и медитативный поток.',
    highlights: [
      '24 видеоурока в 4K с детальным разбором геометрии асан',
      'Методичка по дыханию Удджайи и точкам концентрации Дришти',
      'Закрытый чат обратной связи и проверка вашей техники мастером',
      'Сертификат о прохождении курса в профиле New Age'
    ],
    basePrice: 6900,
    baseCurrency: 'RUB',
    discountPercent: 25,
    isSponsored: true,
    sponsoredPlacement: ['yoga', 'all'],
    badgeLabel: '🔥 ХИТ • СПОНСИРОВАНО',
    bgGradient: 'linear-gradient(135deg, #F59E0B, #EA580C)'
  },
  {
    id: 'course-meditation-vipassana',
    title: '30 Дней Випассаны: Остановка Внутреннего Диалога',
    subtitle: 'Практическое руководство по выходу из тревожности в чистое присутствие наблюдателя',
    category: 'meditation',
    categoryLabel: 'Медитация',
    authorName: 'Анна Сатори',
    authorRole: 'Трансперсональный психолог, мастер майндфулнесс',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authorVerified: true,
    rating: 4.95,
    studentsCount: 980,
    lessonsCount: 30,
    durationLabel: '30 дней • Ежедневные сессии',
    format: 'Интенсив',
    description: 'Системный протокол постепенного успокоения ума. Вы научитесь растождествляться со стрессовыми мыслями, управлять вниманием и восстанавливать внутренний ресурс в любых условиях.',
    highlights: [
      '30 управляемых аудио-медитаций с бинауральными частотами 432 Гц',
      'Ежедневный трекер осознанности и дневник наблюдений',
      'Прямые эфиры вопросов и ответов каждую субботу',
      'Доступ к библиотеке дыхательных практик навсегда'
    ],
    basePrice: 4900,
    baseCurrency: 'RUB',
    discountPercent: 20,
    isSponsored: true,
    sponsoredPlacement: ['meditation', 'all'],
    badgeLabel: '✨ РЕКОМЕНДУЕМ',
    bgGradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)'
  },
  {
    id: 'course-affirm-neuro',
    title: 'Нейро-Аффирмации и Код Изобилия',
    subtitle: 'Научная перепрошивка ограничивающих убеждений и денежного мышления',
    category: 'affirmations',
    categoryLabel: 'Аффирмации и Мышление',
    authorName: 'Михаил Рассветов',
    authorRole: 'Нейрокоуч, исследователь квантовой психологии',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    authorVerified: true,
    rating: 4.92,
    studentsCount: 2310,
    lessonsCount: 21,
    durationLabel: '21 день • Трансформация подсознания',
    format: 'Интенсив',
    description: 'Как перестать саботировать свой успех и создать стабильный поток благополучия. Работа с тета-состоянием, формулирование эффективных вербальных кодов и удаление родовых установок дефицита.',
    highlights: [
      '21 аудио-настройка для прослушивания перед сном и утром',
      'Рабочая тетрадь по нейтрализации страха больших денег',
      'Алгоритм формулирования индивидуальных аффирмаций под вашу цель',
      'Чат единомышленников и поддерживающее поле группы'
    ],
    basePrice: 5500,
    baseCurrency: 'RUB',
    discountPercent: 15,
    isSponsored: true,
    sponsoredPlacement: ['affirmations', 'all'],
    badgeLabel: '💎 ТОП КУРС',
    bgGradient: 'linear-gradient(135deg, #EC4899, #F43F5E)'
  },
  {
    id: 'course-breath-wimhof',
    title: 'Искусство Дыхания: Метод Пранаямы и Сверх-Иммунитета',
    subtitle: 'Управление уровнем энергии, стрессом и биохимией крови через дыхание',
    category: 'breathing',
    categoryLabel: 'Дыхание',
    authorName: 'Артур Прана',
    authorRole: 'Сертифицированный инструктор по экстремальному дыханию',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    authorVerified: true,
    rating: 4.91,
    studentsCount: 760,
    lessonsCount: 16,
    durationLabel: '4 недели • 16 видеопрактик',
    format: 'Видеокурс',
    description: 'Освойте древнейшие техники Пранаямы (Капалабхати, Бхастрика, Нади Шодхана) в синтезе с современным физиологическим методом гипервентиляции и холодового закаливания.',
    highlights: [
      '16 пошаговых тренировок с метрономом и аудио-ведением',
      'Гайд по измерению пульсовой волны и кислородного насыщения',
      'Техники моментального выхода из панических атак за 3 минуты',
      'Протоколы дыхания для спортсменов и руководителей'
    ],
    basePrice: 3900,
    baseCurrency: 'RUB',
    discountPercent: 20,
    isSponsored: true,
    sponsoredPlacement: ['breathing', 'all'],
    badgeLabel: '🌬️ АНТИСТРЕСС',
    bgGradient: 'linear-gradient(135deg, #0284C7, #06B6D4)'
  },
  {
    id: 'course-sound-bowls',
    title: 'Звукотерапия: Исцеление Тибетскими Чашами и Гонгом',
    subtitle: 'Практический курс саунд-хилера для дома и профессиональной помощи близким',
    category: 'soundhealing',
    categoryLabel: 'Саундхилинг',
    authorName: 'Елена Голден',
    authorRole: 'Звукотерапевт, музыкант, ведущая soundbath-сессий',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    authorVerified: true,
    rating: 4.97,
    studentsCount: 520,
    lessonsCount: 18,
    durationLabel: '3 недели • Видео + Аудиобиблиотека',
    format: 'Видеокурс',
    description: 'Как правильно выбирать кованые чаши, извлекать чистые обертоны, структурировать воду и гармонизировать энергетическое поле человека через звуковой резонанс.',
    highlights: [
      '18 видеоуроков по технике звукоизвлечения стиком и колотушкой',
      'Коллекция несжатых звуковых файлов (WAV 96kHz/24bit) для медитаций',
      'Схемы расстановки чаш вокруг тела человека',
      'Методичка по соответствию нот и энергетических центров (чакр)'
    ],
    basePrice: 4200,
    baseCurrency: 'RUB',
    isSponsored: false,
    sponsoredPlacement: ['all'],
    badgeLabel: '🎶 АУДИОКУРС',
    bgGradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)'
  },
  {
    id: 'course-retreat-altai',
    title: 'Ретрит Молчания «Сердце Алтая» (7 дней)',
    subtitle: 'Полная перезагрузка в местах силы: медитации, баня на травах, йога на рассвете',
    category: 'retreats',
    categoryLabel: 'Живые Ретриты',
    authorName: 'Центр Осознанности «Беловодье»',
    authorRole: 'Эко-ретритный центр в долине реки Катунь',
    authorAvatar: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=150&auto=format&fit=crop&q=80',
    authorVerified: true,
    rating: 5.0,
    studentsCount: 22,
    lessonsCount: 7,
    durationLabel: '7 дней оффлайн • Алтай',
    format: 'Ретрит',
    description: 'Неделя без гаджетов и городского шума. Проживание в кедровых домиках, вегетарианское питание от шеф-повара, радиальные выходы в горы, молчаливая випассана и ночные посиделки у костра.',
    highlights: [
      'Включено: трансфер из Горно-Алтайска, эко-питание, проживание',
      'Ежедневная утренняя йога и вечерние чайные церемонии',
      'Банные ритуалы с горными травами и купелью с родниковой водой',
      'Ограниченная группа: всего 12 участников'
    ],
    basePrice: 48000,
    baseCurrency: 'RUB',
    discountPercent: 10,
    isSponsored: true,
    sponsoredPlacement: ['all'],
    badgeLabel: '⛰️ МЕСТА СИЛЫ',
    bgGradient: 'linear-gradient(135deg, #10B981, #059669)'
  }
];

