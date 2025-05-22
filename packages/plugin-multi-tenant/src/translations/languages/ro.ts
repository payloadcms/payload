import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const roTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Sunteți pe punctul de a schimba proprietatea de la <0>{{fromTenant}}</0> la <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Confirmați schimbarea {{tenantLabel}}',
    'field-assignedTentant-label': 'Locatar Atribuit',
  },
}

export const ro: PluginLanguage = {
  dateFNSKey: 'ro',
  translations: roTranslations,
}
