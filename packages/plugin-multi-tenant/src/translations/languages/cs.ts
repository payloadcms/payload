import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const csTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Přiřadit nájemce',
    'assign-tenant-modal-title': 'Přiřadit "{{title}}"',
    'field-assignedTenant-label': 'Přiřazený nájemce',
    'nav-tenantSelector-label': 'Nájemce',
  },
}

export const cs: PluginLanguage = {
  dateFNSKey: 'cs',
  translations: csTranslations,
}
