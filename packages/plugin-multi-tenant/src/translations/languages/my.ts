import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const myTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'အသစ်ထည့်သည့် Tenant',
    'assign-tenant-modal-fallback-title': 'Tetapkan {{entity}} baru',
    'field-assignedTenant-label': 'ခွဲစိုက်ထားသော အငှားယူသူ',
    'nav-tenantSelector-label': 'Penyewa',
  },
}

export const my: PluginLanguage = {
  dateFNSKey: 'en-US',
  translations: myTranslations,
}
