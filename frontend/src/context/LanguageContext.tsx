import React, { createContext, useContext, useState, useEffect } from 'react';
import { type SupportedLanguage, type LanguageInfo, LANGUAGES, translations } from '../i18n/translations';

interface LanguageContextType {
  currentLang: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  languages: LanguageInfo[];
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'new_age_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
    if (saved && ['ru', 'en', 'es', 'de', 'zh', 'fr', 'ar'].includes(saved)) {
      return saved;
    }
    const navLang = navigator.language.slice(0, 2);
    if (['ru', 'en', 'es', 'de', 'zh', 'fr', 'ar'].includes(navLang)) {
      return navLang as SupportedLanguage;
    }
    return 'ru';
  });

  const activeLangInfo = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentLang);
    document.documentElement.lang = currentLang;
    document.documentElement.dir = activeLangInfo.dir;
  }, [currentLang, activeLangInfo]);

  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLang(lang);
  };

  const t = (key: string): string => {
    const langDict = translations[currentLang];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to Russian, then English, then key itself
    return translations.ru[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        setLanguage,
        languages: LANGUAGES,
        t,
        dir: activeLangInfo.dir,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
