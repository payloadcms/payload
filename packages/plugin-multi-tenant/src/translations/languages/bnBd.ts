import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnBdTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'টেনেন্ট নির্ধারণ করুন',
    'assign-tenant-modal-title': '"{{title}}" নিয়োগ করুন',
    'field-assignedTenant-label': 'নিযুক্ত টেনেন্ট',
    'nav-tenantSelector-label': 'টেনেন্ট অনুসারে ফিল্টার করুন',
  },
}

export const bnBd: PluginLanguage = {
  dateFNSKey: 'bn-BD',
  translations: bnBdTranslations,
}
