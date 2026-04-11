import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const trTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Kiracı Ata',
    'assign-tenant-modal-title': '"{{title}}" atayın.',
    'field-assignedTenant-label': 'Atanan Kiracı',
    'nav-tenantSelector-label': 'Kiracı',
  },
}

export const tr: PluginLanguage = {
  dateFNSKey: 'tr',
  translations: trTranslations,
}
