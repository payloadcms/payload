import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const nlTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Toewijzen Tenant',
    'assign-tenant-modal-title': 'Wijs "{{title}}" toe',
    'field-assignedTenant-label': 'Toegewezen Huurder',
    'nav-tenantSelector-label': 'Huurder',
  },
}

export const nl: PluginLanguage = {
  dateFNSKey: 'nl',
  translations: nlTranslations,
}
