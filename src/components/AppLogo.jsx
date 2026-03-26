import React, { useState, useEffect } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const PUBLIC_SETTINGS_URL = `${API_BASE}/api/public/app-settings`;

/**
 * Fetches and displays platform logo (or platform name) for sidebar and login pages.
 * Uses public API so it works without auth.
 */
export default function AppLogo({ className = '', imgClassName = '', showTagline = false, light = false }) {
  const [logoUrl, setLogoUrl] = useState(null);
  const [platformName, setPlatformName] = useState('Stockship');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(PUBLIC_SETTINGS_URL, { method: 'GET' })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (cancelled) return;
        const payload = data?.data ?? data;
        if (payload?.logoUrl) setLogoUrl(payload.logoUrl);
        if (payload?.platformName) setPlatformName(payload.platformName || 'Stockship');
      })
      .catch(() => { /* use defaults */ })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  const fullLogoUrl = logoUrl ? (logoUrl.startsWith('http') ? logoUrl : `${API_BASE}${logoUrl}`) : null;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {loaded && fullLogoUrl ? (
        <img
          src={fullLogoUrl}
          alt={platformName}
          className={`object-contain max-h-12 w-auto ${imgClassName}`}
        />
      ) : (
        <span className={`font-bold text-lg whitespace-nowrap ${light ? 'text-white' : 'text-gray-900'}`}>
          {platformName}
        </span>
      )}
      {showTagline && (
        <span className={`text-xs mt-0.5 ${light ? 'text-white/80' : 'text-gray-500'}`}>A LIFE WE BUILD</span>
      )}
    </div>
  );
}
