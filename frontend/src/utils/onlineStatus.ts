// Утилита форматирования статуса онлайн и времени последнего визита

export function pluralizeRu(n: number, one: string, few: string, many: string): string {
  const nAbs = Math.abs(n);
  const mod10 = nAbs % 10;
  const mod100 = nAbs % 100;

  if (mod100 >= 11 && mod100 <= 19) {
    return `${n} ${many}`;
  }
  if (mod10 === 1) {
    return `${n} ${one}`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${n} ${few}`;
  }
  return `${n} ${many}`;
}

/**
 * Полный статус активности пользователя для профиля и заголовка диалога
 * Примеры:
 * - "В сети"
 * - "Был(а) в сети только что"
 * - "Был(а) в сети 5 минут назад"
 * - "Был(а) в сети 2 часа назад"
 * - "Был(а) в сети вчера"
 * - "Был(а) в сети 3 дня назад"
 */
export function formatLastSeen(
  lastSeen?: string | Date | null,
  isOnline?: boolean,
  serverText?: string | null
): string {
  if (isOnline) {
    return 'В сети';
  }

  if (!lastSeen) {
    if (serverText && serverText.trim().length > 0) {
      return serverText;
    }
    return 'Был(а) в сети недавно';
  }

  const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  if (isNaN(date.getTime())) {
    return serverText || 'Был(а) в сети недавно';
  }

  const diffMs = Date.now() - date.getTime();

  // Если время в будущем или меньше 60 сек
  if (diffMs < 0 || diffMs < 60 * 1000) {
    return 'Был(а) в сети только что';
  }

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) {
    return `Был(а) в сети ${pluralizeRu(minutes, 'минуту', 'минуты', 'минут')} назад`;
  }

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 24) {
    return `Был(а) в сети ${pluralizeRu(hours, 'час', 'часа', 'часов')} назад`;
  }

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 1) {
    return 'Был(а) в сети вчера';
  }
  if (days < 7) {
    return `Был(а) в сети ${pluralizeRu(days, 'день', 'дня', 'дней')} назад`;
  }

  const weeks = Math.floor(days / 7);
  if (days < 30 && weeks > 0) {
    return `Был(а) в сети ${pluralizeRu(weeks, 'неделю', 'недели', 'недель')} назад`;
  }

  return 'Был(а) в сети давно';
}

/**
 * Компактный статус для списков чатов и карточек
 * Примеры: "в сети", "5 мин назад", "2 ч назад", "вчера", "3 дн назад"
 */
export function formatLastSeenShort(
  lastSeen?: string | Date | null,
  isOnline?: boolean
): string {
  if (isOnline) {
    return 'в сети';
  }

  if (!lastSeen) {
    return 'не в сети';
  }

  const date = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;
  if (isNaN(date.getTime())) {
    return 'не в сети';
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60 * 1000) {
    return 'только что';
  }

  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) {
    return `${minutes} мин назад`;
  }

  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 24) {
    return `${hours} ч назад`;
  }

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 1) {
    return 'вчера';
  }
  if (days < 7) {
    return `${days} дн назад`;
  }

  return 'давно';
}
