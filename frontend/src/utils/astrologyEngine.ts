export interface NatalChartData {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  elementDominant: 'Огонь' | 'Земля' | 'Воздух' | 'Вода';
  elementBalance: {
    fire: number;
    earth: number;
    air: number;
    water: number;
  };
  humanDesign: {
    type: 'Генератор' | 'Манифестирующий Генератор' | 'Проектор' | 'Манифестор' | 'Рефлектор';
    profile: string;
    strategy: string;
    authority: string;
    definedCenters: string[];
    openCenters: string[];
  };
  lunarPhase: {
    name: string;
    illumination: string;
    recommendation: string;
  };
  destinyVector: string;
}

const ZODIAC_SIGNS = [
  'Овен', 'Телец', 'Близнецы', 'Рак', 
  'Лев', 'Дева', 'Весы', 'Скорпион', 
  'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
];

export function calculateNatalChart(birthDate: string, birthTime: string = '12:00', city: string = 'Москва'): NatalChartData {
  const d = new Date(birthDate);
  const day = isNaN(d.getDate()) ? 15 : d.getDate();
  const month = isNaN(d.getMonth()) ? 5 : d.getMonth() + 1;
  const [hours] = birthTime.split(':').map(Number);
  const hour = isNaN(hours) ? 12 : hours;

  // Sun Sign Calculation
  const sunSign = getSunSign(day, month);

  // Ascendant Calculation based on time of birth
  const ascIndex = (ZODIAC_SIGNS.indexOf(sunSign) + Math.floor(hour / 2)) % 12;
  const ascendant = ZODIAC_SIGNS[ascIndex];

  // Moon Sign Calculation
  const moonIndex = (ZODIAC_SIGNS.indexOf(sunSign) + Math.floor(day / 2.5)) % 12;
  const moonSign = ZODIAC_SIGNS[moonIndex];

  // Element Balance
  const fire = (day * 3 + hour * 2) % 35 + 15;
  const earth = (month * 5 + day) % 30 + 15;
  const air = (hour * 4 + 7) % 30 + 15;
  const water = 100 - (fire + earth + air);

  let elementDominant: 'Огонь' | 'Земля' | 'Воздух' | 'Вода' = 'Огонь';
  const maxEl = Math.max(fire, earth, air, water);
  if (maxEl === earth) elementDominant = 'Земля';
  else if (maxEl === air) elementDominant = 'Воздух';
  else if (maxEl === water) elementDominant = 'Вода';

  // Human Design mapping
  const hdTypes: NatalChartData['humanDesign']['type'][] = [
    'Генератор', 'Манифестирующий Генератор', 'Проектор', 'Манифестор', 'Рефлектор'
  ];
  const typeIndex = (day + month + hour) % hdTypes.length;
  const selectedType = hdTypes[typeIndex];

  const profiles = ['1/3 Исследователь-Мученик', '2/4 Отшельник-Оппортунист', '3/5 Мученик-Еретик', '4/6 Оппортунист-Ролевая модель', '5/1 Еретик-Исследователь', '6/2 Ролевая модель-Отшельник'];
  const profile = profiles[(day + hour) % profiles.length];

  const strategies: Record<string, string> = {
    'Генератор': 'Откликаться на запросы жизни из сакрального центра. Не инициировать из ума.',
    'Манифестирующий Генератор': 'Слушать отклик, информировать близких перед стартом и действовать молниеносно.',
    'Проектор': 'Ждать искреннего признания и персонального приглашения в проекты и отношения.',
    'Манифестор': 'Информировать окружающих перед началом действий для снятия сопротивления.',
    'Рефлектор': 'Ждать лунный цикл (28.5 дней) для принятия судьбоносных решений.'
  };

  const authorities: Record<string, string> = {
    'Генератор': 'Сакральный (звуки отклика угу / не-а)',
    'Манифестирующий Генератор': 'Эмоциональный (ясность после волны чувств)',
    'Проектор': 'Селезеночный (инстинктивная интуиция в моменте)',
    'Манифестор': 'Эмоциональный солнечный центр',
    'Рефлектор': 'Лунный лучевой авторитет'
  };

  return {
    sunSign,
    moonSign,
    ascendant,
    elementDominant,
    elementBalance: { fire, earth, air, water: Math.max(10, water) },
    humanDesign: {
      type: selectedType,
      profile,
      strategy: strategies[selectedType],
      authority: authorities[selectedType],
      definedCenters: ['Сакрал', 'Горло', 'Аджна', 'G-центр любви и направления'],
      openCenters: ['Эмоциональный', 'Теменной', 'Эго-центр воли']
    },
    lunarPhase: {
      name: 'Растущая Луна в знаке ' + moonSign,
      illumination: '68%',
      recommendation: 'Идеальное время для запуска медитаций на изобилие, обучения и укрепления энергетического тела.'
    },
    destinyVector: `Ваш космический код объединяет лидерский импульс знака ${sunSign} с интуитивной глубиной асцендента в знаке ${ascendant}. Город рождения (${city}) активирует сектор наставничества и передачи практик.`
  };
}

function getSunSign(day: number, month: number): string {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Овен';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Телец';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Близнецы';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Рак';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Лев';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Дева';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Весы';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Скорпион';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Стрелец';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Козерог';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Водолей';
  return 'Рыбы';
}
