// =============================================================================
// УТИЛИТА АВТООПРЕДЕЛЕНИЯ СТРАНЫ И ТЕЛЕФОННЫХ КОДОВ
// Определение по: TimeZone + Browser Locale + IP Geolocation API + Fallback
// =============================================================================

export interface CountryInfo {
  code: string;       // ISO 3166-1 alpha-2 ('RU', 'BY', 'KZ', etc.)
  nameRu: string;     // Название на русском
  nameEn: string;     // Название на английском
  flag: string;       // Emoji флаг
  dialCode: string;   // Телефонный код ('+7', '+375', '+1', etc.)
  mask: string;       // Маска ввода номера
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'RU', nameRu: 'Россия', nameEn: 'Russia', flag: '🇷🇺', dialCode: '+7', mask: '+7 (999) 999-99-99' },
  { code: 'BY', nameRu: 'Беларусь', nameEn: 'Belarus', flag: '🇧🇾', dialCode: '+375', mask: '+375 (99) 999-99-99' },
  { code: 'KZ', nameRu: 'Казахстан', nameEn: 'Kazakhstan', flag: '🇰🇿', dialCode: '+7', mask: '+7 (799) 999-99-99' },
  { code: 'UZ', nameRu: 'Узбекистан', nameEn: 'Uzbekistan', flag: '🇺🇿', dialCode: '+998', mask: '+998 (99) 999-99-99' },
  { code: 'KG', nameRu: 'Кыргызстан', nameEn: 'Kyrgyzstan', flag: '🇰🇬', dialCode: '+996', mask: '+996 (999) 999-999' },
  { code: 'TJ', nameRu: 'Таджикистан', nameEn: 'Tajikistan', flag: '🇹🇯', dialCode: '+992', mask: '+992 (99) 999-99-99' },
  { code: 'AM', nameRu: 'Армения', nameEn: 'Armenia', flag: '🇦🇲', dialCode: '+374', mask: '+374 (99) 999-999' },
  { code: 'AZ', nameRu: 'Азербайджан', nameEn: 'Azerbaijan', flag: '🇦🇿', dialCode: '+994', mask: '+994 (99) 999-99-99' },
  { code: 'GE', nameRu: 'Грузия', nameEn: 'Georgia', flag: '🇬🇪', dialCode: '+995', mask: '+995 (999) 99-99-99' },
  { code: 'MD', nameRu: 'Молдова', nameEn: 'Moldova', flag: '🇲🇩', dialCode: '+373', mask: '+373 (99) 999-999' },
  { code: 'UA', nameRu: 'Украина', nameEn: 'Ukraine', flag: '🇺🇦', dialCode: '+380', mask: '+380 (99) 999-99-99' },
  { code: 'TR', nameRu: 'Турция', nameEn: 'Turkey', flag: '🇹🇷', dialCode: '+90', mask: '+90 (999) 999-99-99' },
  { code: 'AE', nameRu: 'ОАЭ', nameEn: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971', mask: '+971 (99) 999-9999' },
  { code: 'US', nameRu: 'США / Канада', nameEn: 'USA / Canada', flag: '🇺🇸', dialCode: '+1', mask: '+1 (999) 999-9999' },
  { code: 'DE', nameRu: 'Германия', nameEn: 'Germany', flag: '🇩🇪', dialCode: '+49', mask: '+49 (999) 999-9999' },
  { code: 'GB', nameRu: 'Великобритания', nameEn: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', mask: '+44 (999) 999-9999' },
  { code: 'FR', nameRu: 'Франция', nameEn: 'France', flag: '🇫🇷', dialCode: '+33', mask: '+33 (9) 99-99-99-99' },
  { code: 'IT', nameRu: 'Италия', nameEn: 'Italy', flag: '🇮🇹', dialCode: '+39', mask: '+39 (999) 999-9999' },
  { code: 'ES', nameRu: 'Испания', nameEn: 'Spain', flag: '🇪🇸', dialCode: '+34', mask: '+34 (999) 999-999' },
  { code: 'IL', nameRu: 'Израиль', nameEn: 'Israel', flag: '🇮🇱', dialCode: '+972', mask: '+972 (99) 999-9999' },
  { code: 'CN', nameRu: 'Китай', nameEn: 'China', flag: '🇨🇳', dialCode: '+86', mask: '+86 (999) 9999-9999' },
  { code: 'JP', nameRu: 'Япония', nameEn: 'Japan', flag: '🇯🇵', dialCode: '+81', mask: '+81 (99) 9999-9999' },
  { code: 'KR', nameRu: 'Южная Корея', nameEn: 'South Korea', flag: '🇰🇷', dialCode: '+82', mask: '+82 (99) 9999-9999' },
  { code: 'IN', nameRu: 'Индия', nameEn: 'India', flag: '🇮🇳', dialCode: '+91', mask: '+91 (99999) 99999' },
  { code: 'TH', nameRu: 'Таиланд', nameEn: 'Thailand', flag: '🇹🇭', dialCode: '+66', mask: '+66 (99) 999-9999' },
  { code: 'RS', nameRu: 'Сербия', nameEn: 'Serbia', flag: '🇷🇸', dialCode: '+381', mask: '+381 (99) 999-9999' },
  { code: 'CY', nameRu: 'Кипр', nameEn: 'Cyprus', flag: '🇨🇾', dialCode: '+357', mask: '+357 (99) 999-999' },
  { code: 'PL', nameRu: 'Польша', nameEn: 'Poland', flag: '🇵🇱', dialCode: '+48', mask: '+48 (999) 999-999' },
  { code: 'CZ', nameRu: 'Чехия', nameEn: 'Czech Republic', flag: '🇨🇿', dialCode: '+420', mask: '+420 (999) 999-999' },
  { code: 'ID', nameRu: 'Индонезия (Бали)', nameEn: 'Indonesia', flag: '🇮🇩', dialCode: '+62', mask: '+62 (999) 9999-9999' }
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Россия по умолчанию

// Словарь часовых поясов для мгновенного (0 мс) бессерверного определения
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  'Europe/Moscow': 'RU',
  'Europe/Samara': 'RU',
  'Europe/Volgograd': 'RU',
  'Europe/Kaliningrad': 'RU',
  'Asia/Yekaterinburg': 'RU',
  'Asia/Omsk': 'RU',
  'Asia/Novosibirsk': 'RU',
  'Asia/Krasnoyarsk': 'RU',
  'Asia/Irkutsk': 'RU',
  'Asia/Yakutsk': 'RU',
  'Asia/Vladivostok': 'RU',
  'Asia/Magadan': 'RU',
  'Asia/Kamchatka': 'RU',
  'Europe/Minsk': 'BY',
  'Asia/Almaty': 'KZ',
  'Asia/Qyzylorda': 'KZ',
  'Asia/Aqtobe': 'KZ',
  'Asia/Aqtau': 'KZ',
  'Asia/Atyrau': 'KZ',
  'Asia/Oral': 'KZ',
  'Asia/Tashkent': 'UZ',
  'Asia/Samarkand': 'UZ',
  'Asia/Bishkek': 'KG',
  'Asia/Dushanbe': 'TJ',
  'Asia/Yerevan': 'AM',
  'Asia/Baku': 'AZ',
  'Asia/Tbilisi': 'GE',
  'Europe/Chisinau': 'MD',
  'Europe/Kiev': 'UA',
  'Europe/Kyiv': 'UA',
  'Europe/Istanbul': 'TR',
  'Asia/Dubai': 'AE',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Toronto': 'US',
  'Europe/Berlin': 'DE',
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Rome': 'IT',
  'Europe/Madrid': 'ES',
  'Asia/Jerusalem': 'IL',
  'Asia/Shanghai': 'CN',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Kolkata': 'IN',
  'Asia/Bangkok': 'TH',
  'Europe/Belgrade': 'RS',
  'Asia/Nicosia': 'CY',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Asia/Makassar': 'ID',
  'Asia/Jakarta': 'ID'
};

/**
 * Мгновенное определение страны по браузеру (Timezone + Locale)
 */
export function detectCountryFromBrowser(): CountryInfo {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      const code = TIMEZONE_TO_COUNTRY[tz];
      const match = COUNTRIES.find(c => c.code === code);
      if (match) return match;
    }

    // Если таймзона не совпала, проверяем язык системы
    const lang = navigator.language?.toUpperCase() || '';
    if (lang.includes('-')) {
      const region = lang.split('-')[1];
      const match = COUNTRIES.find(c => c.code === region);
      if (match) return match;
    }

    if (lang.startsWith('RU')) {
      return DEFAULT_COUNTRY;
    }
  } catch (e) {
    console.warn('Ошибка локального автоопределения страны:', e);
  }

  return DEFAULT_COUNTRY;
}

// Кэш для предотвращения лишних внешних запросов
let cachedDetectedCountry: CountryInfo | null = null;

/**
 * Полное автоопределение: сначала быстрый браузерный метод, затем проверка через IP Geolocation API
 */
export async function detectUserCountry(): Promise<CountryInfo> {
  if (cachedDetectedCountry) {
    return cachedDetectedCountry;
  }

  const browserGuessed = detectCountryFromBrowser();

  // Пытаемся уточнить через бесплатный быстрый IP Geolocation (таймаут 1.8с)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800);

    // Сначала пробуем встроенный бекенд или надежный сервис country.is
    const res = await fetch('https://api.country.is', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.country) {
        const found = COUNTRIES.find(c => c.code.toUpperCase() === String(data.country).toUpperCase());
        if (found) {
          cachedDetectedCountry = found;
          return found;
        }
      }
    }
  } catch {
    // В случае оффлайна или блокировки используем браузерную таймзону
  }

  cachedDetectedCountry = browserGuessed;
  return browserGuessed;
}

/**
 * Автоопределение города и страны через Geolocation API браузера
 */
export async function detectUserCityAndCountry(): Promise<{ city?: string; country: string; fullLocation: string } | null> {
  // 1. Попытка через GPS / Geolocation браузера с обратным геокодированием
  if ('geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000 });
      });

      const { latitude, longitude } = pos.coords;
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const address = geoData.address || {};
        const city = address.city || address.town || address.village || address.state;
        const country = address.country || (await detectUserCountry()).nameRu;

        const fullLocation = city ? `${city}, ${country}` : country;
        return { city, country, fullLocation };
      }
    } catch {
      // Игнорируем и переходим к IP-определению
    }
  }

  // 2. Fallback через IP
  const country = await detectUserCountry();
  return {
    country: country.nameRu,
    fullLocation: country.nameRu
  };
}
