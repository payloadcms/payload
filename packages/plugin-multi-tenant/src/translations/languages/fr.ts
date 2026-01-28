import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const frTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Attribuer un Locataire',
    'assign-tenant-modal-title': 'Attribuer "{{title}}"',
    'field-assignedTenant-label': 'Locataire Attribué',
    'nav-tenantSelector-label': 'Locataire',
  },
}

export const fr: PluginLanguage = {
  dateFNSKey: 'fr',
  translations: frTranslations,
}
