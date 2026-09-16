/**
 * Horoscope Engine (Гороскоп на каждый день)
 * Обеспечивает точный расчет ежедневного гороскопа день-в-день:
 * - По выбранной дате (сегодня, завтра, вчера или любая дата)
 * - По дате рождения (день, месяц, год) с определением знака зодиака, декады, стихии и правящей планеты
 * - Прогноз на сегодня по ключевым сферам жизни: Общий настрой, Любовь и Отношения, Карьера и Деньги, Здоровье и Энергия, Совет дня
 * - Астрологические метрики: Процент удачи, Число дня, Счастливый цвет, Совместимый знак дня, Планетарный фокус
 */

export interface ZodiacSignInfo {
  id: string;
  name: string;
  latinName: string;
  symbol: string;
  element: 'Огонь' | 'Земля' | 'Воздух' | 'Вода';
  rulingPlanet: string;
  dateRange: string;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  gradient: string;
  color: string;
  iconSymbol: string;
}

export interface DailyHoroscope {
  sign: ZodiacSignInfo;
  dateStr: string;
  formattedDate: string;
  isToday: boolean;
  dayType: 'Вчера' | 'Сегодня' | 'Завтра' | 'Выбранный день';
  
  // Ключевой текст прогноза в стиле пользователя ("Вас ожидает...")
  headline: string;
  mainForecast: string;

  // Разделы прогноза
  loveForecast: string;
  careerForecast: string;
  healthForecast: string;
  adviceOfTheDay: string;

  // Числовые показатели и космические метрики дня
  energyLevel: number; // 0 - 100%
  luckPercentage: number; // 0 - 100%
  luckyNumber: number;
  luckyTime: string;
  luckyColor: string;
  compatibleSign: string;
  moonPhaseToday: string;
  planetaryAspect: string;
}

export const ZODIAC_SIGNS_LIST: ZodiacSignInfo[] = [
  {
    id: 'aries',
    name: 'Овен',
    latinName: 'Aries',
    symbol: '♈',
    element: 'Огонь',
    rulingPlanet: 'Марс',
    dateRange: '21 марта — 19 апреля',
    startMonth: 3,
    startDay: 21,
    endMonth: 4,
    endDay: 19,
    gradient: 'linear-gradient(135deg, #EF4444, #F97316)',
    color: '#EF4444',
    iconSymbol: '🔥'
  },
  {
    id: 'taurus',
    name: 'Телец',
    latinName: 'Taurus',
    symbol: '♉',
    element: 'Земля',
    rulingPlanet: 'Венера',
    dateRange: '20 апреля — 20 мая',
    startMonth: 4,
    startDay: 20,
    endMonth: 5,
    endDay: 20,
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    color: '#10B981',
    iconSymbol: '🌿'
  },
  {
    id: 'gemini',
    name: 'Близнецы',
    latinName: 'Gemini',
    symbol: '♊',
    element: 'Воздух',
    rulingPlanet: 'Меркурий',
    dateRange: '21 мая — 20 июня',
    startMonth: 5,
    startDay: 21,
    endMonth: 6,
    endDay: 20,
    gradient: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
    color: '#06B6D4',
    iconSymbol: '💨'
  },
  {
    id: 'cancer',
    name: 'Рак',
    latinName: 'Cancer',
    symbol: '♋',
    element: 'Вода',
    rulingPlanet: 'Луна',
    dateRange: '21 июня — 22 июля',
    startMonth: 6,
    startDay: 21,
    endMonth: 7,
    endDay: 22,
    gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    color: '#6366F1',
    iconSymbol: '🌊'
  },
  {
    id: 'leo',
    name: 'Лев',
    latinName: 'Leo',
    symbol: '♌',
    element: 'Огонь',
    rulingPlanet: 'Солнце',
    dateRange: '23 июля — 22 августа',
    startMonth: 7,
    startDay: 23,
    endMonth: 8,
    endDay: 22,
    gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    color: '#F59E0B',
    iconSymbol: '👑'
  },
  {
    id: 'virgo',
    name: 'Дева',
    latinName: 'Virgo',
    symbol: '♍',
    element: 'Земля',
    rulingPlanet: 'Меркурий',
    dateRange: '23 августа — 22 сентября',
    startMonth: 8,
    startDay: 23,
    endMonth: 9,
    endDay: 22,
    gradient: 'linear-gradient(135deg, #14B8A6, #0D9488)',
    color: '#14B8A6',
    iconSymbol: '🌾'
  },
  {
    id: 'libra',
    name: 'Весы',
    latinName: 'Libra',
    symbol: '♎',
    element: 'Воздух',
    rulingPlanet: 'Венера',
    dateRange: '23 сентября — 22 октября',
    startMonth: 9,
    startDay: 23,
    endMonth: 10,
    endDay: 22,
    gradient: 'linear-gradient(135deg, #EC4899, #A855F7)',
    color: '#EC4899',
    iconSymbol: '⚖️'
  },
  {
    id: 'scorpio',
    name: 'Скорпион',
    latinName: 'Scorpio',
    symbol: '♏',
    element: 'Вода',
    rulingPlanet: 'Плутон / Марс',
    dateRange: '23 октября — 21 ноября',
    startMonth: 10,
    startDay: 23,
    endMonth: 11,
    endDay: 21,
    gradient: 'linear-gradient(135deg, #8B5CF6, #4C1D95)',
    color: '#8B5CF6',
    iconSymbol: '🦂'
  },
  {
    id: 'sagittarius',
    name: 'Стрелец',
    latinName: 'Sagittarius',
    symbol: '♐',
    element: 'Огонь',
    rulingPlanet: 'Юпитер',
    dateRange: '22 ноября — 21 декабря',
    startMonth: 11,
    startDay: 22,
    endMonth: 12,
    endDay: 21,
    gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
    color: '#F97316',
    iconSymbol: '🏹'
  },
  {
    id: 'capricorn',
    name: 'Козерог',
    latinName: 'Capricorn',
    symbol: '♑',
    element: 'Земля',
    rulingPlanet: 'Сатурн',
    dateRange: '22 декабря — 19 января',
    startMonth: 12,
    startDay: 22,
    endMonth: 1,
    endDay: 19,
    gradient: 'linear-gradient(135deg, #475569, #1E293B)',
    color: '#64748B',
    iconSymbol: '⛰️'
  },
  {
    id: 'aquarius',
    name: 'Водолей',
    latinName: 'Aquarius',
    symbol: '♒',
    element: 'Воздух',
    rulingPlanet: 'Уран / Сатурн',
    dateRange: '20 января — 18 февраля',
    startMonth: 1,
    startDay: 20,
    endMonth: 2,
    endDay: 18,
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    color: '#3B82F6',
    iconSymbol: '⚡'
  },
  {
    id: 'pisces',
    name: 'Рыбы',
    latinName: 'Pisces',
    symbol: '♓',
    element: 'Вода',
    rulingPlanet: 'Нептун / Юпитер',
    dateRange: '19 февраля — 20 марта',
    startMonth: 2,
    startDay: 19,
    endMonth: 3,
    endDay: 20,
    gradient: 'linear-gradient(135deg, #06B6D4, #8B5CF6)',
    color: '#06B6D4',
    iconSymbol: '✨'
  }
];

/**
 * Определение знака зодиака по дню и месяцу рождения
 */
export function getZodiacByBirthDate(day: number, month: number): ZodiacSignInfo {
  for (const sign of ZODIAC_SIGNS_LIST) {
    if (sign.startMonth === sign.endMonth) {
      if (month === sign.startMonth && day >= sign.startDay && day <= sign.endDay) return sign;
    } else if (sign.startMonth === 12 && sign.endMonth === 1) {
      // Козерог (22 дек — 19 янв)
      if ((month === 12 && day >= sign.startDay) || (month === 1 && day <= sign.endDay)) return sign;
    } else {
      if ((month === sign.startMonth && day >= sign.startDay) || (month === sign.endMonth && day <= sign.endDay)) {
        return sign;
      }
    }
  }
  return ZODIAC_SIGNS_LIST[0]; // fallback Овен
}

/**
 * Псевдо-рандомный генератор с детерминированным сидом для стабильного гороскопа на конкретный день
 */
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Банк уникальных вариантов предсказаний по стихиям и знакам
const HEADLINES_BANK = [
  'Вас ожидает мощный прилив вдохновения и долгожданный прорыв в ключевых вопросах.',
  'Вас ожидает день гармоничных решений, удачных встреч и приятных сюрпризов.',
  'Вас ожидает важный диалог, который расставит все точки над «i» и снимет напряжение.',
  'Вас ожидает раскрытие скрытых возможностей и яркий успех в делах, начатых ранее.',
  'Вас ожидает спокойный и продуктивный день, наполненный внутренней ясностью и уверенностью.',
  'Вас ожидает неожиданная финансовая возможность или поддержка авторитетного человека.',
  'Вас ожидает всплеск романтической энергии и теплое сближение с близким человеком.',
  'Вас ожидает динамичный день смелых шагов, где решительность станет залогом победы.'
];

const MAIN_FORECASTS = [
  'Звезды благоволят вам: положение планет создает защитный щит вокруг ваших инициатив. Сосредоточьтесь на главной цели и не распыляйте энергию на мелкие споры. Вселенная помогает тем, кто уверен в своем пути.',
  'Сегодня день интуитивной точности. Внутренний голос окажется надежнее любых советов со стороны. Обратите внимание на совпадения и знаки — они укажут верное направление в текущих делах.',
  'Гармоничный аспект светил раскрывает ваш потенциал обаяния и дипломатии. Любые переговоры, звонки и новые знакомства сегодня пройдут с максимальной пользой для вашего будущего.',
  'Энергетика дня требует баланса между действием и осознанным отдыхом. Утренние часы идеальны для решения трудных задач, а вечер подарит долгожданное душевное спокойствие.',
  'Сегодня прекрасный момент, чтобы освободиться от груза сомнений и сделать решительный шаг вперед. Обстоятельства складываются так, что даже рискованные задумки имеют высокий шанс на успех.',
  'Космические транзиты активируют сектор вашего признания. Ваша искренность и честный подход привлекут союзников, а ваши таланты будут оценены по достоинству.'
];

const LOVE_FORECASTS = [
  'В отношениях наступает полоса нежности и взаимного понимания. Одиноких представителей знака ждет притягательное знакомство или теплое сообщение.',
  'Позвольте себе открыто выразить чувства. Искренний комплимент или спонтанный жест внимания сотворят маленькое чудо в вашем союзе.',
  'Эмоциональный фон стабилен. Не ищите скрытых смыслов в словах партнера — доверьтесь теплоте текущего момента.',
  'Ваша притягательность сегодня на пике. Внимание окружающих обеспечено, главное — оставаться верным своим истинным ценностям.',
  'Идеальное время для душевного разговора по душам за чашкой чая. Прежние разногласия легко растворятся в атмосфере доверия.'
];

const CAREER_FORECASTS = [
  'На профессиональном поприще вас ждет признание вашей компетентности. Время для демонстрации результатов и смелых предложений руководству.',
  'Финансовые вопросы решаются легко и выгодно. Возможно неожиданное поступление средств, одобрение сделки или скидка на важную покупку.',
  'В работе держите фокус на деталях. Ваши аналитические способности помогут вовремя предотвратить ошибку и сэкономить ресурсы команды.',
  'Отличный день для коллективных проектов и мозговых штурмов. Ваша идея получит бурную поддержку коллег и клиентов.',
  'Удачный период для обучения, освоения новых цифровых навыков и расширения зоны своего влияния.'
];

const HEALTH_FORECASTS = [
  'Жизненный тонус на высоте. Тело готово к активным физическим нагрузкам, прогулкам на свежем воздухе и водным процедурам.',
  'Звезды советуют уделить внимание режиму сна и качественному питанию. Легкая растяжка или дыхательная гимнастика снимут зажимы.',
  'Высокий энергетический уровень позволит решить массу задач без усталости, однако к вечеру обязательно найдите время для тишины.',
  'Особое внимание уделите водному балансу и ограничьте кофеин. Травяные чаи и медитация подарят глубокую перезагрузку нервной системе.',
  'Организм полон восстановительных сил. Прекрасный день для уходовых процедур, спа, массажа и заботы о своем теле.'
];

const ADVICES_BANK = [
  'Не бойтесь делать первый шаг — смелость сегодня щедро вознаграждается.',
  'Слушайте отклик сердца: если внутри рождается радость, значит, путь истинен.',
  'Завершите одно начатое дело, прежде чем браться за новое, и вы ощутите легкость.',
  'Дарите добро без ожиданий, и оно вернется к вам в троекратном размере.',
  'Улыбнитесь новому дню: сегодня мир готов пойти вам навстречу.',
  'Сохраняйте внутреннее спокойствие — оно станет вашим главным ориентиром.'
];

const LUCKY_COLORS = [
  'Глубокий индиго', 'Солнечный золотой', 'Изумрудный шелк', 'Небесно-голубой',
  'Винный гранат', 'Королевский пурпур', 'Теплый терракот', 'Мягкий жемчужный'
];

const MOON_PHASES = [
  'Растущая Луна в знаке силы',
  'Полнолуние — пик интуиции и вдохновения',
  'Убывающая Луна — время очищения и мудрости',
  'Новолуние — закладка фундамента новых свершений',
  'Первая четверть — импульс уверенного роста'
];

const PLANETARY_ASPECTS = [
  'Трин Солнца и Юпитера (Аспект великой удачи)',
  'Секстиль Венеры и Марса (Гармония страсти и разума)',
  'Соединение Луны с Меркурием (Острая интуиция и красноречие)',
  'Благоприятный транзит Сатурна (Прочность позиций и надежность)',
  'Гармоничный аспект Урана (Озарения и неожиданные счастливые шансы)'
];

/**
 * Рассчитывает подробный персональный гороскоп на конкретную дату
 * @param targetDate целевая дата прогноза (YYYY-MM-DD)
 * @param signId идентификатор знака (aries, taurus, etc.)
 * @param birthYear опциональный год рождения для нумерологической калибровки
 */
export function calculateDailyHoroscope(
  targetDate: string,
  signId: string,
  birthYear?: number
): DailyHoroscope {
  const sign = ZODIAC_SIGNS_LIST.find(s => s.id === signId) || ZODIAC_SIGNS_LIST[0];
  
  const d = new Date(targetDate);
  const targetYear = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const targetMonth = isNaN(d.getMonth()) ? new Date().getMonth() + 1 : d.getMonth() + 1;
  const targetDay = isNaN(d.getDate()) ? new Date().getDate() : d.getDate();

  // Вычисляем статус дня относительно сегодняшней даты
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const isToday = targetDate === todayStr;
  
  const targetTime = new Date(targetYear, targetMonth - 1, targetDay).setHours(0, 0, 0, 0);
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).setHours(0, 0, 0, 0);
  const diffDays = Math.round((targetTime - todayTime) / (1000 * 60 * 60 * 24));

  let dayType: DailyHoroscope['dayType'] = 'Выбранный день';
  if (diffDays === 0) dayType = 'Сегодня';
  else if (diffDays === -1) dayType = 'Вчера';
  else if (diffDays === 1) dayType = 'Завтра';

  const dateFormatted = new Date(targetYear, targetMonth - 1, targetDay).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long'
  });

  // Создаем математический сид из даты и знака зодиака + года рождения
  const signIndex = ZODIAC_SIGNS_LIST.findIndex(s => s.id === sign.id);
  const seed = (targetYear * 10000) + (targetMonth * 100) + targetDay + (signIndex * 137) + ((birthYear || 1995) % 100);

  const rnd1 = seededRandom(seed + 1);
  const rnd2 = seededRandom(seed + 2);
  const rnd3 = seededRandom(seed + 3);
  const rnd4 = seededRandom(seed + 4);
  const rnd5 = seededRandom(seed + 5);
  const rnd6 = seededRandom(seed + 6);
  const rnd7 = seededRandom(seed + 7);

  // Выбор предсказаний
  const headline = HEADLINES_BANK[Math.floor(rnd1 * HEADLINES_BANK.length)];
  const mainForecast = MAIN_FORECASTS[Math.floor(rnd2 * MAIN_FORECASTS.length)];
  const loveForecast = LOVE_FORECASTS[Math.floor(rnd3 * LOVE_FORECASTS.length)];
  const careerForecast = CAREER_FORECASTS[Math.floor(rnd4 * CAREER_FORECASTS.length)];
  const healthForecast = HEALTH_FORECASTS[Math.floor(rnd5 * HEALTH_FORECASTS.length)];
  const adviceOfTheDay = ADVICES_BANK[Math.floor(rnd6 * ADVICES_BANK.length)];

  // Метрики
  const energyLevel = Math.round(70 + rnd1 * 28); // 70-98%
  const luckPercentage = Math.round(75 + rnd2 * 24); // 75-99%
  const luckyNumber = Math.floor(rnd3 * 99) + 1;
  
  const luckyHour = Math.floor(9 + rnd4 * 12);
  const luckyMinute = Math.floor(rnd5 * 4) * 15;
  const luckyTime = `${String(luckyHour).padStart(2, '0')}:${String(luckyMinute).padStart(2, '0')}`;

  const luckyColor = LUCKY_COLORS[Math.floor(rnd6 * LUCKY_COLORS.length)];
  
  const compatibleSignIndex = (signIndex + Math.floor(rnd7 * 11) + 1) % 12;
  const compatibleSign = ZODIAC_SIGNS_LIST[compatibleSignIndex].name;

  const moonPhaseToday = MOON_PHASES[Math.floor(rnd1 * MOON_PHASES.length)];
  const planetaryAspect = PLANETARY_ASPECTS[Math.floor(rnd2 * PLANETARY_ASPECTS.length)];

  return {
    sign,
    dateStr: targetDate,
    formattedDate: dateFormatted,
    isToday,
    dayType,
    headline,
    mainForecast,
    loveForecast,
    careerForecast,
    healthForecast,
    adviceOfTheDay,
    energyLevel,
    luckPercentage,
    luckyNumber,
    luckyTime,
    luckyColor,
    compatibleSign,
    moonPhaseToday,
    planetaryAspect
  };
}
