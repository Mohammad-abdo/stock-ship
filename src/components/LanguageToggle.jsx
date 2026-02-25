import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const isRTL = language === 'ar';

  const handleSelect = (code) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors text-sm font-medium min-w-[110px] justify-between shadow-sm"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={current.label}
      >
        <Globe className="w-4 h-4 shrink-0" />
        <span className="truncate">{current.label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute top-full mt-1 min-w-[160px] py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-[100]"
          style={isRTL ? { right: 0 } : { left: 0 }}
        >
          {LANGUAGES.map((opt) => (
            <li key={opt.code} role="option" aria-selected={language === opt.code}>
              <button
                type="button"
                onClick={() => handleSelect(opt.code)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded ${isRTL ? 'text-right flex-row-reverse' : 'text-left'}`}
              >
                <span>{opt.label}</span>
                {language === opt.code && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
