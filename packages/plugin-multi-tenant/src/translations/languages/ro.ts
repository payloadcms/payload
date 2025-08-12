import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const roTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Sunteți pe cale să schimbați proprietatea de la <0>{{fromTenant}}</0> la <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Confirmați modificarea {{tenantLabel}}',
    'field-assignedTenant-label': 'Locatar Atribuit',
    'nav-tenantSelector-label': 'Locatar',
  },
}

export const ro: PluginLanguage = {
  dateFNSKey: 'ro',
  translations: roTranslations,
}
