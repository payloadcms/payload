import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnBdTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'টেনেন্ট নিয়োগ করুন',
    'assign-tenant-modal-fallback-title': 'নতুন {{entity}} দায়িত্ব দিন',
    'field-assignedTenant-label': 'নির্ধারিত টেনেন্ট',
    'nav-tenantSelector-label': 'টেনেন্ট অনুসারে ফিল্টার করুন',
  },
}

export const bnBd: PluginLanguage = {
  dateFNSKey: 'bn-BD',
  translations: bnBdTranslations,
}
