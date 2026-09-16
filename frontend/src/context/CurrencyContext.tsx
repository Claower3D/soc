import React, { createContext, useContext, useState, useEffect } from 'react';
import { detectCountryFromBrowser, detectUserCountry, type CountryInfo } from '../utils/countryDetect';

export type CurrencyCode = 
  | 'RUB' 
  | 'BYN' 
  | 'KZT' 
  | 'UZS' 
  | 'KGS' 
  | 'AMD' 
  | 'AZN' 
  | 'GEL' 
  | 'UAH' 
  | 'TRY' 
  | 'AED' 
  | 'USD' 
  | 'EUR' 
  | 'GBP' 
  | 'CNY' 
  | 'USDT' 
  | 'AGE';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rateToRub: number; // 1 unit of this currency = X RUB
}

export const ALL_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  RUB: { code: 'RUB', symbol: '₽', name: 'Российский рубль', flag: '🇷🇺', rateToRub: 1 },
  BYN: { code: 'BYN', symbol: 'Br', name: 'Белорусский рубль', flag: '🇧🇾', rateToRub: 28.5 },
  KZT: { code: 'KZT', symbol: '₸', name: 'Казахстанский тенге', flag: '🇰🇿', rateToRub: 0.20 },
  UZS: { code: 'UZS', symbol: "so'm", name: 'Узбекский сум', flag: '🇺🇿', rateToRub: 0.0073 },
  KGS: { code: 'KGS', symbol: 'сом', name: 'Кыргызский сом', flag: '🇰🇬', rateToRub: 1.04 },
  AMD: { code: 'AMD', symbol: '֏', name: 'Армянский драм', flag: '🇦🇲', rateToRub: 0.24 },
  AZN: { code: 'AZN', symbol: '₼', name: 'Азербайджанский манат', flag: '🇦🇿', rateToRub: 54.2 },
  GEL: { code: 'GEL', symbol: '₾', name: 'Грузинский лари', flag: '🇬🇪', rateToRub: 33.8 },
  UAH: { code: 'UAH', symbol: '₴', name: 'Украинская гривна', flag: '🇺🇦', rateToRub: 2.25 },
  TRY: { code: 'TRY', symbol: '₺', name: 'Турецкая лира', flag: '🇹🇷', rateToRub: 2.85 },
  AED: { code: 'AED', symbol: 'AED', name: 'Дирхам ОАЭ', flag: '🇦🇪', rateToRub: 25.0 },
  USD: { code: 'USD', symbol: '$', name: 'Доллар США', flag: '🇺🇸', rateToRub: 92.0 },
  EUR: { code: 'EUR', symbol: '€', name: 'Евро', flag: '🇪🇺', rateToRub: 100.0 },
  GBP: { code: 'GBP', symbol: '£', name: 'Британский фунт', flag: '🇬🇧', rateToRub: 117.0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Китайский юань', flag: '🇨🇳', rateToRub: 12.8 },
  USDT: { code: 'USDT', symbol: '₮', name: 'Tether (USDT)', flag: '🪙', rateToRub: 92.0 },
  AGE: { code: 'AGE', symbol: '🪙 AGE', name: 'New Age Token', flag: '✨', rateToRub: 10.0 }
};

// Соответствие ISO-кода страны и её валюты
const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  RU: 'RUB',
  BY: 'BYN',
  KZ: 'KZT',
  UZ: 'UZS',
  KG: 'KGS',
  AM: 'AMD',
  AZ: 'AZN',
  GE: 'GEL',
  UA: 'UAH',
  MD: 'EUR',
  TR: 'TRY',
  AE: 'AED',
  US: 'USD',
  CA: 'USD',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  CY: 'EUR',
  NL: 'EUR',
  GB: 'GBP',
  CN: 'CNY',
  IL: 'USD',
  PL: 'EUR',
  CZ: 'EUR',
  RS: 'EUR',
  ID: 'USD',
  TH: 'USD'
};

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyConfig: CurrencyConfig;
  setCurrency: (currency: CurrencyCode) => void;
  formatPrice: (rubBaseAmount: number) => string;
  convertPrice: (rubBaseAmount: number) => number;
  allCurrencies: CurrencyConfig[];
  detectedFromCountry: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'new_age_currency';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode;
    if (saved && ALL_CURRENCIES[saved]) {
      return saved;
    }

    // Мгновенное автоопределение по таймзоне и региону браузера
    const detected = detectCountryFromBrowser();
    if (detected && COUNTRY_TO_CURRENCY[detected.code]) {
      return COUNTRY_TO_CURRENCY[detected.code];
    }

    return 'RUB';
  });

  const [detectedFromCountry, setDetectedFromCountry] = useState<string | null>(null);

  // Уточнение валюты через Geolocation / IP API при загрузке
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      detectUserCountry().then((country: CountryInfo) => {
        if (country && COUNTRY_TO_CURRENCY[country.code]) {
          const autoCurr = COUNTRY_TO_CURRENCY[country.code];
          setCurrencyState(autoCurr);
          setDetectedFromCountry(country.nameRu);
        }
      });
    }
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  const currencyConfig = ALL_CURRENCIES[currency] || ALL_CURRENCIES.RUB;

  // Конвертация из базовой цены в рублях в активную валюту
  const convertPrice = (rubBaseAmount: number): number => {
    if (!rubBaseAmount) return 0;
    if (currency === 'RUB') return rubBaseAmount;

    const rate = currencyConfig.rateToRub;
    const targetAmount = rubBaseAmount / rate;

    // Округление в зависимости от номинала валюты
    if (currency === 'UZS' || currency === 'KZT') {
      return Math.round(targetAmount / 10) * 10;
    }
    if (currency === 'USD' || currency === 'EUR' || currency === 'GBP' || currency === 'USDT') {
      return Math.round(targetAmount * 10) / 10;
    }
    return Math.round(targetAmount);
  };

  // Форматирование цены со знаком валюты
  const formatPrice = (rubBaseAmount: number): string => {
    const converted = convertPrice(rubBaseAmount);
    const formatted = converted >= 100 
      ? Math.round(converted).toLocaleString('ru-RU')
      : converted.toFixed(1).replace('.0', '');

    if (currency === 'USD') return `$${formatted}`;
    if (currency === 'EUR') return `€${formatted}`;
    if (currency === 'GBP') return `£${formatted}`;
    if (currency === 'USDT') return `${formatted} ₮`;
    if (currency === 'AGE') return `${formatted} 🪙 AGE`;

    return `${formatted} ${currencyConfig.symbol}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyConfig,
        setCurrency,
        formatPrice,
        convertPrice,
        allCurrencies: Object.values(ALL_CURRENCIES),
        detectedFromCountry,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
