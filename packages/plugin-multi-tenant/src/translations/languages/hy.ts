import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const hyTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Տեղադրել Tenant',
    'assign-tenant-modal-title': 'Հանձնել "{{title}}"',
    'field-assignedTenant-label': 'Հանձնարարված վարձակալ',
    'nav-tenantSelector-label': 'Տենանտ',
  },
}

export const hy: PluginLanguage = {
  dateFNSKey: 'hy-AM',
  translations: hyTranslations,
}
