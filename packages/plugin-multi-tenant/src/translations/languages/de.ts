import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const deTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Mandant zuweisen',
    'assign-tenant-modal-title': '"{{title}}" zuweisen',
    'field-assignedTenant-label': 'Zugewiesener Mandant',
    'nav-tenantSelector-label': 'Mandant',
  },
}

export const de: PluginLanguage = {
  dateFNSKey: 'de',
  translations: deTranslations,
}
