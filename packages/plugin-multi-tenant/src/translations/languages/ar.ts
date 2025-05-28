import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const arTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'أنت على وشك تغيير الملكية من <0>{{fromTenant}}</0> إلى <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'تأكيد تغيير {{tenantLabel}}',
    'field-assignedTentant-label': 'المستأجر المعين',
  },
}

export const ar: PluginLanguage = {
  dateFNSKey: 'ar',
  translations: arTranslations,
}
