import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const daTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Tildel Tenant',
    'assign-tenant-modal-title': 'Tildel "{{title}}"',
    'field-assignedTenant-label': 'Tildelt Lejer',
    'nav-tenantSelector-label': 'Lejer',
  },
}

export const da: PluginLanguage = {
  dateFNSKey: 'da',
  translations: daTranslations,
}
