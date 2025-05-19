import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ukTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Ви збираєтесь змінити власність з <0>{{fromTenant}}</0> на <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Підтвердіть зміну {{tenantLabel}}',
    'field-assignedTentant-label': 'Призначений орендар',
  },
}

export const uk: PluginLanguage = {
  dateFNSKey: 'uk',
  translations: ukTranslations,
}
