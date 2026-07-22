import { createContext, useState, useContext } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('vktori_lang') || 'sv'; // default to Swedish as requested by client
  });

  const toggleLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('vktori_lang', lang);
  };

  const t = (key) => {
    if (!key) return '';
    
    if (typeof key === 'string' && key.includes(':')) {
      const parts = key.split(':');
      const prefix = parts[0].trim();
      const rest = parts.slice(1).join(':');
      return t(prefix) + ': ' + rest;
    }

    // Clean key and convert to camelCase for lookup
    // E.g., "Home Page" -> "homePage", "Matters / Cases" -> "mattersCases"
    const cleaned = key.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    const words = cleaned.split(/\s+/).filter(Boolean);
    const camelKey = words
      .map((word, index) => {
        if (index === 0) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');

    const dict = translations[language] || {};
    const fallbackDict = translations['sv'] || {}; // fallback to Swedish

    return dict[camelKey] || dict[key] || fallbackDict[camelKey] || fallbackDict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
