import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const rsLatinTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Uskoro ćete promeniti vlasništvo sa <0>{{fromTenant}}</0> na <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Potvrdite promenu {{tenantLabel}}',
    'field-assignedTenant-label': 'Dodeljen stanar',
    'nav-tenantSelector-label': 'Podstanar',
  },
}

export const rsLatin: PluginLanguage = {
  dateFNSKey: 'rs-Latin',
  translations: rsLatinTranslations,
}
