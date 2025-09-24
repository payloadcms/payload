import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const nbTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Tildel Leietaker',
    'assign-tenant-modal-title': 'Tildel "{{title}}"',
    'field-assignedTenant-label': 'Tildelt leietaker',
    'nav-tenantSelector-label': 'Leietaker',
  },
}

export const nb: PluginLanguage = {
  dateFNSKey: 'nb',
  translations: nbTranslations,
}
