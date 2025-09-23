import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const frTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Attribuer un Locataire',
    'assign-tenant-modal-fallback-title': 'Attribuer un nouveau {{entity}}',
    'field-assignedTenant-label': 'Locataire Attribué',
    'nav-tenantSelector-label': 'Locataire',
  },
}

export const fr: PluginLanguage = {
  dateFNSKey: 'fr',
  translations: frTranslations,
}
