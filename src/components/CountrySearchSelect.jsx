import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, ChevronDown } from 'lucide-react';
import { countries, getFlagUrl } from '@/data/countries';

/**
 * Searchable country dropdown. Filters by Arabic and English names.
 * value/onChange use country nameEn (same as form state).
 */
export function CountrySearchSelect({ value, onChange, placeholder, searchPlaceholder, isRTL, className = '', hasError }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.nameEn === value) || null,
    [value]
  );

  const filtered = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
        (c.nameAr && c.nameAr.includes(q)) ||
        (c.nameAr && c.nameAr.toLowerCase().includes(q))
    );
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const displayName = selectedCountry
    ? isRTL
      ? (selectedCountry.nameAr || selectedCountry.nameEn)
      : selectedCountry.nameEn
    : '';

  const baseInputClass =
    'w-full py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white';
  const paddingClass = selectedCountry
    ? isRTL
      ? 'pr-16 pl-10'
      : 'pl-16 pr-10'
    : isRTL
      ? 'pr-10 pl-4'
      : 'pl-10 pr-4';
  const borderClass = hasError ? 'border-red-500 bg-red-50/50' : 'border-gray-300';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${baseInputClass} ${paddingClass} ${borderClass} ${className} text-left flex items-center justify-between min-h-[42px]`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={placeholder}
      >
        <span className="flex items-center gap-2 truncate">
          <MapPin className={`flex-shrink-0 text-gray-400 w-5 h-5 ${isRTL ? 'order-2' : ''}`} />
          {selectedCountry && (
            <img
              src={getFlagUrl(selectedCountry.code)}
              alt=""
              className="w-6 h-4 object-cover rounded-sm border border-gray-200 flex-shrink-0"
              loading="lazy"
            />
          )}
          <span className="truncate">{displayName || placeholder}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden"
          role="listbox"
        >
          <div className="p-2 border-b border-gray-100 bg-gray-50/80 sticky top-0">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 left-3" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder || (isRTL ? 'ابحث عن الدولة...' : 'Search country...')}
                className="w-full py-2 pl-9 pr-3 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setOpen(false);
                }}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">
                {isRTL ? 'لا توجد نتائج' : 'No results'}
              </div>
            ) : (
              filtered.map((c) => {
                const name = isRTL ? (c.nameAr || c.nameEn) : c.nameEn;
                const isSelected = value === c.nameEn;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange({ target: { name: 'country', value: c.nameEn } });
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-100 transition-colors ${isSelected ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    <img
                      src={getFlagUrl(c.code)}
                      alt=""
                      className="w-6 h-4 object-cover rounded-sm border border-gray-200 flex-shrink-0"
                      loading="lazy"
                    />
                    <span className="flex-1 truncate">{name}</span>
                    {isSelected && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CountrySearchSelect;
