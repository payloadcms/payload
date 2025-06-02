import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const rsLatinTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Uskoro ćete promeniti vlasništvo sa <0>{{fromTenant}}</0> na <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Potvrdite promenu {{tenantLabel}}',
    'field-assignedTentant-label': 'Dodeljen stanar',
  },
}

export const rsLatin: PluginLanguage = {
  dateFNSKey: 'rs-Latin',
  translations: rsLatinTranslations,
}
