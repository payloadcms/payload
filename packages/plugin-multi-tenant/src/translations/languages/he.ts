import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const heTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'הקצה Tenant',
    'assign-tenant-modal-fallback-title': 'הקצה {{entity}} חדש',
    'field-assignedTenant-label': 'דייר מוקצה',
    'nav-tenantSelector-label': 'דייר',
  },
}

export const he: PluginLanguage = {
  dateFNSKey: 'he',
  translations: heTranslations,
}
