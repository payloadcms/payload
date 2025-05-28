import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const heTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'אתה עומד לשנות בעלות מ- <0>{{fromTenant}}</0> ל- <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'אשר שינוי {{tenantLabel}}',
    'field-assignedTentant-label': 'דייר מוקצה',
  },
}

export const he: PluginLanguage = {
  dateFNSKey: 'he',
  translations: heTranslations,
}
