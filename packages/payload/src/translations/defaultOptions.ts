import type { InitOptions } from 'i18next'

import translations from './index'

export const defaultOptions: InitOptions = {
  debug: false,
  detection: {
    caches: ['cookie', 'localStorage'],
    lookupCookie: 'lng',
    lookupLocalStorage: 'lng',
    order: ['cookie', 'localStorage'],
  },
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: translations,
  supportedLngs: Object.keys(translations),
}
