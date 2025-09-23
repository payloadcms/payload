import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const azTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Kirayəçiyə təyin et',
    'assign-tenant-modal-fallback-title': 'Yeni {{entity}} təyin et',
    'field-assignedTenant-label': 'Təyin edilmiş İcarəçi',
    'nav-tenantSelector-label': 'Kirayəçi',
  },
}

export const az: PluginLanguage = {
  dateFNSKey: 'az',
  translations: azTranslations,
}
