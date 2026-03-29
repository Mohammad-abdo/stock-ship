import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import enTranslations from '@/locales/en.json';
import arTranslations from '@/locales/ar.json';

const LanguageContext = createContext();

/**
 * JSON files cannot express "inherit missing keys from English".
 * Also, duplicate keys in JSON (invalid but accepted by parsers) drop earlier entries.
 * Merging Arabic onto English ensures every English path exists at runtime; Arabic only overrides leaves.
 */
function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepMergeI18n(base, override) {
  if (!isPlainObject(base)) return override !== undefined ? override : base;
  if (!isPlainObject(override)) return override;
  const keys = new Set([...Object.keys(base), ...Object.keys(override)]);
  const out = {};
  for (const k of keys) {
    const b = base[k];
    const o = override[k];
    if (o === undefined) {
      out[k] = b;
      continue;
    }
    if (b === undefined) {
      out[k] = o;
      continue;
    }
    if (isPlainObject(b) && isPlainObject(o)) {
      out[k] = deepMergeI18n(b, o);
    } else {
      out[k] = o;
    }
  }
  return out;
}

const translations = {
  en: enTranslations,
  ar: deepMergeI18n(enTranslations, arTranslations),
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

    const resolve = (root) => {
      let value = root;
      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) return undefined;
      }
      if (typeof value === 'object' && value !== null) return undefined;
      return value;
    };

    const primary = resolve(translations[language]);
    if (primary !== undefined) return primary;

    if (language !== 'en') {
      const fallback = resolve(translations.en);
      if (fallback !== undefined) return fallback;
    }

    return key;
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  }, []);

  const setLanguageStable = useCallback((lang) => {
    if (translations[lang]) setLanguage(lang);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const isRTL = language === 'ar';
  const contextValue = useMemo(() => ({
    language,
    isRTL,
    setLanguage: setLanguageStable,
    t,
    toggleLanguage
  }), [language, isRTL, setLanguageStable, t, toggleLanguage]);

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
