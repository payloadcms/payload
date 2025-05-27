import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const esTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Está a punto de cambiar la propiedad de <0>{{fromTenant}}</0> a <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Confirme el cambio de {{tenantLabel}}',
    'field-assignedTentant-label': 'Inquilino Asignado',
  },
}

export const es: PluginLanguage = {
  dateFNSKey: 'es',
  translations: esTranslations,
}
