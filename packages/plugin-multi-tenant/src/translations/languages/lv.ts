import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const lvTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Piešķirt Tenant',
    'assign-tenant-modal-title': 'Piešķirt "{{title}}"',
    'field-assignedTenant-label': 'Piešķirtais tenants',
    'nav-tenantSelector-label': 'Filtrēt pēc Nomnieka',
  },
}

export const lv: PluginLanguage = {
  dateFNSKey: 'lv',
  translations: lvTranslations,
}
