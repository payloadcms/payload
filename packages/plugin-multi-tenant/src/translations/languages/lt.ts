import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ltTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Jūs ketinate pakeisti nuosavybės teisę iš <0>{{fromTenant}}</0> į <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Patvirtinkite {{tenantLabel}} pakeitimą',
    'field-assignedTentant-label': 'Paskirtas nuomininkas',
  },
}

export const lt: PluginLanguage = {
  dateFNSKey: 'lt',
  translations: ltTranslations,
}
