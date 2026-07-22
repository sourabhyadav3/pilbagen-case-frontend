import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { translations } from './locales/translations';

// Construct the nested resources exactly how i18next expects them,
// utilizing our existing translations dictionary as the translation bundle.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translations.en
      },
      sv: {
        translation: translations.sv
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
