import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bnBdTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'এই নথিটির মালিকানা নির্ধারণ করুন। নিচের নির্বাচনটি আপডেট করুন এবং আপনার পরিবর্তনগুলি নিশ্চিত করুন।',
    'assign-document-modal-title': 'নথি নির্ধারণ করুন',
    'confirm-modal-tenant-switch--body':
      'আপনি যাচ্ছেন মালিকানা পরিবর্তন করতে <0>{{fromTenant}}</0> থেকে <0>{{toTenant}}</0> এ।',
    'confirm-modal-tenant-switch--heading': '{{tenantLabel}} পরিবর্তন নিশ্চিত করুন',
    'field-assignedTenant-label': 'নির্ধারিত টেনেন্ট',
    'nav-tenantSelector-label': 'ভাড়াটিয়া',
  },
}

export const bnBd: PluginLanguage = {
  dateFNSKey: 'bn-BD',
  translations: bnBdTranslations,
}
