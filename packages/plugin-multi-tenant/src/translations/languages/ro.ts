import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const roTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Alocați Tenant',
    'assign-tenant-modal-fallback-title': 'Atribuiți un nou {{entity}}',
    'field-assignedTenant-label': 'Locatar Atribuit',
    'nav-tenantSelector-label': 'Locatar',
  },
}

export const ro: PluginLanguage = {
  dateFNSKey: 'ro',
  translations: roTranslations,
}
