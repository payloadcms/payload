import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const idTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Tetapkan Tenant',
    'assign-tenant-modal-title': 'Tetapkan "{{title}}"',
    'field-assignedTenant-label': 'Penyewa yang Ditugaskan',
    'nav-tenantSelector-label': 'Filter berdasarkan Tenant',
  },
}

export const id: PluginLanguage = {
  dateFNSKey: 'id',
  translations: idTranslations,
}
