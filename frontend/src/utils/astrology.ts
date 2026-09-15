export interface ZodiacInfo {
  sign: string;
  symbol: string;
  element: string;
  planet: string;
  easternSign: string;
  easternElement: string;
  age: number;
}

export function getZodiacSign(day: number, month: number): { sign: string; symbol: string; element: string; planet: string } {
  // month: 1..12
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return { sign: 'Овен', symbol: '♈', element: 'Огонь 🔥', planet: 'Марс' };
  }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return { sign: 'Телец', symbol: '♉', element: 'Земля 🌍', planet: 'Венера' };
  }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return { sign: 'Близнецы', symbol: '♊', element: 'Воздух 💨', planet: 'Меркурий' };
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return { sign: 'Рак', symbol: '♋', element: 'Вода 🌊', planet: 'Луна' };
  }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return { sign: 'Лев', symbol: '♌', element: 'Огонь 🔥', planet: 'Солнце' };
  }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return { sign: 'Дева', symbol: '♍', element: 'Земля 🌍', planet: 'Меркурий' };
  }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return { sign: 'Весы', symbol: '♎', element: 'Воздух 💨', planet: 'Венера' };
  }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return { sign: 'Скорпион', symbol: '♏', element: 'Вода 🌊', planet: 'Плутон, Марс' };
  }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return { sign: 'Стрелец', symbol: '♐', element: 'Огонь 🔥', planet: 'Юпитер' };
  }
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return { sign: 'Козерог', symbol: '♑', element: 'Земля 🌍', planet: 'Сатурн' };
  }
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return { sign: 'Водолей', symbol: '♒', element: 'Воздух 💨', planet: 'Уран, Сатурн' };
  }
  return { sign: 'Рыбы', symbol: '♓', element: 'Вода 🌊', planet: 'Нептун, Юпитер' };
}

export function getEasternZodiac(year: number): { animal: string; element: string } {
  const animals = [
    'Крыса 🐀', 'Бык 🐂', 'Тигр 🐅', 'Кролик 🐇',
    'Дракон 🐉', 'Змея 🐍', 'Лошадь 🐎', 'Коза 🐐',
    'Обезьяна 🐒', 'Петух 🐓', 'Собака 🐕', 'Свинья (Кабан) 🐗'
  ];
  const offset = (year - 4) % 12;
  const animal = animals[((offset % 12) + 12) % 12];

  const lastDigit = year % 10;
  let element = 'Металл 🪙';
  if (lastDigit === 0 || lastDigit === 1) element = 'Металл 🪙';
  else if (lastDigit === 2 || lastDigit === 3) element = 'Вода 💧';
  else if (lastDigit === 4 || lastDigit === 5) element = 'Дерево 🌳';
  else if (lastDigit === 6 || lastDigit === 7) element = 'Огонь 🔥';
  else if (lastDigit === 8 || lastDigit === 9) element = 'Земля ⛰️';

  return { animal, element };
}

export function calculateZodiacProfile(birthDateStr?: string): ZodiacInfo | null {
  if (!birthDateStr) return null;
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const western = getZodiacSign(day, month);
  const eastern = getEasternZodiac(year);

  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }

  return {
    sign: `${western.sign} ${western.symbol}`,
    symbol: western.symbol,
    element: western.element,
    planet: western.planet,
    easternSign: eastern.animal,
    easternElement: eastern.element,
    age: Math.max(0, age)
  };
}
