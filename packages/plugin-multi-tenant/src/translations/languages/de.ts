import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const deTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Sie sind dabei, den Besitz von <0>{{fromTenant}}</0> zu <0>{{toTenant}}</0> zu ändern.',
    'confirm-modal-tenant-switch--heading': 'Bestätigung der Änderung von {{tenantLabel}}',
    'field-assignedTenant-label': 'Zugewiesener Mandant',
    'nav-tenantSelector-label': 'Mieter',
  },
}

export const de: PluginLanguage = {
  dateFNSKey: 'de',
  translations: deTranslations,
}
