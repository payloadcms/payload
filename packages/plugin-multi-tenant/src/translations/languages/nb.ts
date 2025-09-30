import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const nbTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Tildel organisasjon',
    'assign-tenant-modal-title': 'Tildel "{{title}}"',
    'field-assignedTenant-label': 'Tildelt organisasjon',
    'nav-tenantSelector-label': 'Filtrer etter organisasjon',
  },
}

export const nb: PluginLanguage = {
  dateFNSKey: 'nb',
  translations: nbTranslations,
}
