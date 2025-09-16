import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ukTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Ви збираєтеся змінити власність з <0>{{fromTenant}}</0> на <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Підтвердіть зміну {{tenantLabel}}',
    'field-assignedTenant-label': 'Призначений орендар',
    'nav-tenantSelector-label': 'Орендар',
  },
}

export const uk: PluginLanguage = {
  dateFNSKey: 'uk',
  translations: ukTranslations,
}
