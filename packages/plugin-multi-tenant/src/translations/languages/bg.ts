import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bgTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Назначаване на Tenant',
    'assign-tenant-modal-fallback-title': 'Присвояване на нов {{entity}}',
    'field-assignedTenant-label': 'Назначен наемател',
    'nav-tenantSelector-label': 'Потребител',
  },
}

export const bg: PluginLanguage = {
  dateFNSKey: 'bg',
  translations: bgTranslations,
}
