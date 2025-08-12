import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const caTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Està a punt de canviar la propietat de <0>{{fromTenant}}</0> a <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Confirmeu el canvi de {{tenantLabel}}',
    'field-assignedTenant-label': 'Llogater Assignat',
    'nav-tenantSelector-label': 'Inquilí',
  },
}

export const ca: PluginLanguage = {
  dateFNSKey: 'ca',
  translations: caTranslations,
}
