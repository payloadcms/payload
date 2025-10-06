import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnInTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'টেনেন্ট নিয়োগ করুন',
    'assign-tenant-modal-title': '"{{title}}" এর দায়িত্ব দিন',
    'field-assignedTenant-label': 'নির্ধারিত টেনেন্ট',
    'nav-tenantSelector-label': 'টেনেন্ট অনুসারে ফিল্টার করুন',
  },
}

export const bnIn: PluginLanguage = {
  dateFNSKey: 'bn-IN',
  translations: bnInTranslations,
}
