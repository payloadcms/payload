import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const myTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
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
