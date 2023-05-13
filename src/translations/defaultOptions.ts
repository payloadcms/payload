import type { InitOptions } from 'i18next';
import translations from './index';

export const defaultOptions: InitOptions = {
  fallbackLng: 'en',
  debug: false,
  supportedLngs: Object.keys(translations),
  resources: translations,
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: [
      'cookie',
      'localStorage',
    ],
    lookupCookie: 'lng',
    lookupLocalStorage: 'lng',
    caches: [
      'cookie',
      'localStorage',
    ],
  },
};
