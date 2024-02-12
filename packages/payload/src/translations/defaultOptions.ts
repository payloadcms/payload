import type { InitOptions } from 'i18next'

import translations from './index'

export const defaultOptions: InitOptions = {
  debug: false,
  detection: {
    caches: ['cookie', 'localStorage', 'header'],
    lookupCookie: 'lng',
    lookupLocalStorage: 'lng',
    order: ['cookie', 'localStorage', 'header'],
  },
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: translations,
  supportedLngs: Object.keys(translations),
}
