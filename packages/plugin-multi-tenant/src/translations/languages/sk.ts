import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const skTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Priradiť nájomcu',
    'assign-tenant-modal-title': 'Priradiť "{{title}}"',
    'field-assignedTenant-label': 'Pridelený nájomca',
    'nav-tenantSelector-label': 'Nájomca',
  },
}

export const sk: PluginLanguage = {
  dateFNSKey: 'sk',
  translations: skTranslations,
}
