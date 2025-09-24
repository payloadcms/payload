import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const taTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'நீங்கள் உரிமையைக் <0>{{fromTenant}}</0> இலிருந்து <0>{{toTenant}}</0> க்கு மாற்ற உள்ளீர்கள்',
    'confirm-modal-tenant-switch--heading': '{{tenantLabel}} மாற்றத்தை உறுதிப்படுத்தவும்',
    'field-assignedTenant-label': 'ஒதுக்கப்பட்ட Tenant',
    'nav-tenantSelector-label': 'Tenant',
  },
}

export const ta: PluginLanguage = {
  dateFNSKey: 'ta',
  translations: taTranslations,
}
