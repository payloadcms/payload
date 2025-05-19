import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const deTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Sie sind dabei, den Besitz von <0>{{fromTenant}}</0> auf <0>{{toTenant}}</0> zu übertragen.',
    'confirm-tenant-switch--heading': 'Bestätigen Sie die Änderung von {{tenantLabel}}.',
    'field-assignedTentant-label': 'Zugewiesener Mandant',
  },
}

export const de: PluginLanguage = {
  dateFNSKey: 'de',
  translations: deTranslations,
}
