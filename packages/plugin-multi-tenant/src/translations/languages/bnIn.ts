import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnInTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'এই ডকুমেন্টের মালিকানা সেট করুন। নীচের নির্বাচনটি আপডেট করুন এবং আপনার পরিবর্তনগুলি নিশ্চিত করুন।',
    'assign-document-modal-title': 'নথি নির্ধারণ করুন',
    'confirm-modal-tenant-switch--body':
      'আপনি বদলি করতে যাচ্ছেন মালিকানা <0>{{fromTenant}}</0> থেকে <0>{{toTenant}}</0> তে।',
    'confirm-modal-tenant-switch--heading': '{{tenantLabel}} পরিবর্তন নিশ্চিত করুন',
    'field-assignedTenant-label': 'নির্ধারিত টেনেন্ট',
    'nav-tenantSelector-label': 'ভাড়াটিয়া',
  },
}

export const bnIn: PluginLanguage = {
  dateFNSKey: 'bn-IN',
  translations: bnInTranslations,
}
