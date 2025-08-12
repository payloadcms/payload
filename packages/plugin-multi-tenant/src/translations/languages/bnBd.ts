import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnBdTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'আপনি <0>{{fromTenant}}</0> থেকে <0>{{toTenant}}</0> তে মালিকানা পরিবর্তন করতে চলেছেন।',
    'confirm-modal-tenant-switch--heading': '{{tenantLabel}} পরিবর্তন নিশ্চিত করুন',
    'field-assignedTenant-label': 'নির্ধারিত টেনেন্ট',
    'nav-tenantSelector-label': 'ভাড়াটিয়া',
  },
}

export const bnBd: PluginLanguage = {
  dateFNSKey: 'bn-BD',
  translations: bnBdTranslations,
}
