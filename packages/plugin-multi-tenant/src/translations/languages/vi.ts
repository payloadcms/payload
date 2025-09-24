import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const viTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Giao Tenant',
    'assign-tenant-modal-title': 'Gán "{{title}}"',
    'field-assignedTenant-label': 'Người thuê đã được chỉ định',
    'nav-tenantSelector-label': 'Người thuê',
  },
}

export const vi: PluginLanguage = {
  dateFNSKey: 'vi',
  translations: viTranslations,
}
