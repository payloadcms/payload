import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const caTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Estàs a punt de canviar la propietat de <0>{{fromTenant}}</0> a <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Confirmeu el canvi de {{tenantLabel}}',
    'field-assignedTentant-label': 'Llogater Assignat',
  },
}

export const ca: PluginLanguage = {
  dateFNSKey: 'ca',
  translations: caTranslations,
}
