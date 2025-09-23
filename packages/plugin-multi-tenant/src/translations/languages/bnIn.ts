import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnInTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'টেনেন্ট নির্ধারণ করুন',
    'assign-tenant-modal-fallback-title': 'নতুন {{entity}} নির্ধারণ করুন',
    'field-assignedTenant-label': 'নির্ধারিত ভাড়াটিয়া',
    'nav-tenantSelector-label': 'টেনেন্ট অনুসারে ফিল্টার করুন',
  },
}

export const bnIn: PluginLanguage = {
  dateFNSKey: 'bn-IN',
  translations: bnInTranslations,
}
