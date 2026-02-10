import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ClientSettings() {
  const { t } = useLanguage();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">{t('common.settings') || 'Settings'}</h1>
      <p className="text-muted-foreground mt-2">Profile and application settings.</p>
    </div>
  );
}
