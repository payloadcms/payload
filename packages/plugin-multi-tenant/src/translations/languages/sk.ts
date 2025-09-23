import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const skTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Priradiť nájomcu',
    'assign-tenant-modal-fallback-title': 'Prideľte novú {{entity}}',
    'field-assignedTenant-label': 'Pridelený nájomca',
    'nav-tenantSelector-label': 'Nájomca',
  },
}

export const sk: PluginLanguage = {
  dateFNSKey: 'sk',
  translations: skTranslations,
}
