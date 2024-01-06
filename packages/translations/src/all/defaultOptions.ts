import type { InitOptions } from 'i18next'

import translations from './index'

export const defaultOptions: InitOptions = {
  debug: false,
  detection: {
    caches: ['header', 'cookie', 'localStorage'],
    lookupCookie: 'lng',
    lookupLocalStorage: 'lng',
    order: ['header', 'cookie', 'localStorage'],
  },
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  resources: translations,
  supportedLngs: Object.keys(translations),
}
