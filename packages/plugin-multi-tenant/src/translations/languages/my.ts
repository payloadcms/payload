import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const myTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Tetapkan pemilikan dokumen ini. Kemas kini pilihan di bawah dan sahkan perubahan anda.',
    'assign-document-modal-title': 'Menetapkan Dokumen',
    'confirm-modal-tenant-switch--body':
      'Anda akan menukar pemilikan dari <0>{{fromTenant}}</0> kepada <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Sahkan perubahan {{tenantLabel}}',
    'field-assignedTenant-label': 'ခွဲစိုက်ထားသော အငှားယူသူ',
    'nav-tenantSelector-label': 'Penyewa',
  },
}

export const my: PluginLanguage = {
  dateFNSKey: 'en-US',
  translations: myTranslations,
}
