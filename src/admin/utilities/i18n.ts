import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translations from '../../translations';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    supportedLngs: Object.keys(translations),
    resources: translations,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });


export default i18n;
