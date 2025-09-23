import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const isTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Úthluta Leigjanda',
    'assign-tenant-modal-fallback-title': 'Úthluta ný {{entity}}',
    'field-assignedTenant-label': 'Úthlutaður leigjandi',
    'nav-tenantSelector-label': 'Síaðu eftir Leigjanda',
  },
}

export const is: PluginLanguage = {
  dateFNSKey: 'is',
  translations: isTranslations,
}
