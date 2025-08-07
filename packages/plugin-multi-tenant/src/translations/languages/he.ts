import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const heTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'אתה עומד לשנות בעלות מ- <0>{{fromTenant}}</0> ל- <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'אשר שינוי {{tenantLabel}}',
    'field-assignedTenant-label': 'דייר מוקצה',
    'nav-tenantSelector-label': 'דייר',
  },
}

export const he: PluginLanguage = {
  dateFNSKey: 'he',
  translations: heTranslations,
}
