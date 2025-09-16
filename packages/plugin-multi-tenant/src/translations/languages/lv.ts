import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const lvTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Jūs gatavojaties mainīt īpašumtiesības no <0>{{fromTenant}}</0> uz <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Apstipriniet {{tenantLabel}} izmaiņu',
    'field-assignedTenant-label': 'Piešķirts nomnieks',
    'nav-tenantSelector-label': 'Nomnieks',
  },
}

export const lv: PluginLanguage = {
  dateFNSKey: 'lv',
  translations: lvTranslations,
}
