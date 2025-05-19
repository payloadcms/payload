import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const lvTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Jūs gatavojaties mainīt īpašumtiesības no <0>{{fromTenant}}</0> uz <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Apstipriniet {{tenantLabel}} izmaiņu',
    fields: {
      tenantFieldLabel: 'Piešķirts īrnieks',
    },
  },
}

export const lv: PluginLanguage = {
  dateFNSKey: 'lv',
  translations: lvTranslations,
}
