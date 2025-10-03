import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ruTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Назначить Арендатора',
    'assign-tenant-modal-title': 'Назначить "{{title}}"',
    'field-assignedTenant-label': 'Назначенный Арендатор',
    'nav-tenantSelector-label': 'Арендатор',
  },
}

export const ru: PluginLanguage = {
  dateFNSKey: 'ru',
  translations: ruTranslations,
}
