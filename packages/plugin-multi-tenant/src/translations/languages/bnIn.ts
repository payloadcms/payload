import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnInTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'আপনি স্বত্বাধিকার পরিবর্তন করতে চলেছেন <0>{{fromTenant}}</0> থেকে <0>{{toTenant}}</0> এ।',
    'confirm-modal-tenant-switch--heading': '{{tenantLabel}} পরিবর্তন নিশ্চিত করুন',
    'field-assignedTenant-label': 'নির্ধারিত টেনেন্ট',
    'nav-tenantSelector-label': 'ভাড়াটিয়া',
  },
}

export const bnIn: PluginLanguage = {
  dateFNSKey: 'bn-IN',
  translations: bnInTranslations,
}
