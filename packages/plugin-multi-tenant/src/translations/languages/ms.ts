import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const msTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Tetapkan penyewa',
    'assign-tenant-modal-title': 'Tetapkan "{{title}}"',
    'field-assignedTenant-label': 'Penyewa yang ditetapkan',
    'nav-tenantSelector-label': 'Tapis mengikut penyewa',
  },
}

export const ms: PluginLanguage = {
  dateFNSKey: 'ms',
  translations: msTranslations,
}
