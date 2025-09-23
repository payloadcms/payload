import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const lvTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Piešķirt Tenant',
    'assign-tenant-modal-fallback-title': 'Piešķirt jaunu {{entity}}',
    'field-assignedTenant-label': 'Piešķirtais tenants',
    'nav-tenantSelector-label': 'Filtrēt pēc Tenant',
  },
}

export const lv: PluginLanguage = {
  dateFNSKey: 'lv',
  translations: lvTranslations,
}
