import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const rsTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Dodeli Tenant',
    'assign-tenant-modal-title': 'Dodelite "{{title}}"',
    'field-assignedTenant-label': 'Dodeljen stanar',
    'nav-tenantSelector-label': 'Podstanar',
  },
}

export const rs: PluginLanguage = {
  dateFNSKey: 'rs',
  translations: rsTranslations,
}
