import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ltTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Priskirkite nuomininką',
    'assign-tenant-modal-fallback-title': 'Priskirkite naują {{entity}}',
    'field-assignedTenant-label': 'Paskirtas nuomininkas',
    'nav-tenantSelector-label': 'Nuomininkas',
  },
}

export const lt: PluginLanguage = {
  dateFNSKey: 'lt',
  translations: ltTranslations,
}
