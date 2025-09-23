import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnBdTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'টেনেন্ট নির্ধারণ করুন',
    'assign-tenant-modal-fallback-title': 'নতুন {{entity}} নিয়োগ করুন',
    'field-assignedTenant-label': 'নির্ধারিত টেনেন্ট',
    'nav-tenantSelector-label': 'টেনেন্ট দ্বারা ফিল্টার করুন',
  },
}

export const bnBd: PluginLanguage = {
  dateFNSKey: 'bn-BD',
  translations: bnBdTranslations,
}
