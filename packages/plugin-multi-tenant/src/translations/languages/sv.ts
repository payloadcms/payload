import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const svTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Tilldela Hyresgäst',
    'assign-tenant-modal-title': 'Tilldela "{{title}}"',
    'field-assignedTenant-label': 'Tilldelad hyresgäst',
    'nav-tenantSelector-label': 'Hyresgäst',
  },
}

export const sv: PluginLanguage = {
  dateFNSKey: 'sv',
  translations: svTranslations,
}
