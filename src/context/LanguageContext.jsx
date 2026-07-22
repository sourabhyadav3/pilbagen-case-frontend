import { createContext, useState, useContext, useEffect } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext();

const setGoogTransCookie = (lang) => {
  try {
    // Clear any existing googtrans cookies on root, subdomains, and hostnames to prevent duplicate cookies
    const domains = [
      window.location.hostname,
      '.' + window.location.hostname,
      ''
    ];
    
    domains.forEach(domain => {
      const domainStr = domain ? `; domain=${domain}` : '';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${domainStr}`;
    });

    // Set the new cookie on path=/
    if (lang !== 'en') {
      document.cookie = `googtrans=/en/${lang}; path=/;`;
    }
  } catch (e) {
    console.error('Error setting translation cookie:', e);
  }
};

const changeGoogleTranslateLanguage = (lang) => {
  try {
    console.log('[Translation] Target language requested:', lang);
    setGoogTransCookie(lang);
    const selectEl = document.querySelector('#google_translate_master_container select.goog-te-combo');
    if (selectEl && selectEl.options && selectEl.options.length > 1) {
      console.log('[Translation] Found populated goog-te-combo dropdown inside master container');
      
      if (lang === 'en') {
        selectEl.value = 'en';
        if (selectEl.value !== 'en') {
          selectEl.value = '';
        }
      } else {
        selectEl.value = lang;
      }
      
      console.log('[Translation] Set dropdown value to:', selectEl.value);
      // Dispatch a single direct change event to prevent event collisions
      const event = document.createEvent('HTMLEvents');
      event.initEvent('change', true, true);
      selectEl.dispatchEvent(event);
      
      console.log('[Translation] Dispatched change event');
    } else {
      console.log('[Translation] Master container combo dropdown not found/populated yet, retrying in 300ms...');
      setTimeout(() => changeGoogleTranslateLanguage(lang), 300);
    }
  } catch (error) {
    console.error('Error triggering Google Translate:', error);
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('vktori_lang');
    if (saved) return saved;
    return i18n.language?.split('-')[0] || 'sv'; // default to Swedish as requested
  });

  // Keep Google Translate widget synced on mount and language updates
  useEffect(() => {
    i18n.changeLanguage(language);
    // Delay Google Translate to prevent rendering conflicts with React's DOM updates
    const timer = setTimeout(() => {
      changeGoogleTranslateLanguage(language);
    }, 300);
    return () => clearTimeout(timer);
  }, [language]);

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

    // Check if i18n dictionary has the key or camelCase key, otherwise fallback to original key
    if (i18n.exists(camelKey)) return i18n.t(camelKey);
    if (i18n.exists(key)) return i18n.t(key);
    
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
