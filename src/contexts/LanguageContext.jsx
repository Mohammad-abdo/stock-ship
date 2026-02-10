import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';

const LanguageContext = createContext();

const translations = { 
  en: enTranslations, 
  ar: arTranslations 
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Memoize the translation function to prevent infinite re-renders
  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      value = value?.[k];
      if (!value) return key;
    }

    // If the final value is an object, return the key to avoid React rendering errors
    if (typeof value === 'object' && value !== null) {
      return key;
    }

    return value;
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    language,
    t,
    toggleLanguage
  }), [language, t, toggleLanguage]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
