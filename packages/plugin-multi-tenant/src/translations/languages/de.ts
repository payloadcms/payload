import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const deTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Mieter zuweisen',
    'assign-tenant-modal-title': 'Weisen Sie "{{title}}" zu',
    'field-assignedTenant-label': 'Zugewiesener Mandant',
    'nav-tenantSelector-label': 'Mieter',
  },
}

export const de: PluginLanguage = {
  dateFNSKey: 'de',
  translations: deTranslations,
}
