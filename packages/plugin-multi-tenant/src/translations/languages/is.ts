import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const isTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Úthluta leigjanda',
    'assign-tenant-modal-title': 'Úthluta "{{title}}"',
    'field-assignedTenant-label': 'Úthlutaður leigjandi',
    'nav-tenantSelector-label': 'Síaðu eftir leigjanda',
  },
}

export const is: PluginLanguage = {
  dateFNSKey: 'is',
  translations: isTranslations,
}
