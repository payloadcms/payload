import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const myTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Anda akan mengubah pemilikan dari <0>{{fromTenant}}</0> ke <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Sahkan perubahan {{tenantLabel}}',
    'field-assignedTentant-label': 'ခွဲစိုက်ထားသော အငှားယူသူ',
  },
}

export const my: PluginLanguage = {
  dateFNSKey: 'en-US',
  translations: myTranslations,
}
