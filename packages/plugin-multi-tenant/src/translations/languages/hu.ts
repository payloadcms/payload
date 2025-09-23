import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const huTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Hozzárendelési bérlő',
    'assign-tenant-modal-fallback-title': 'Új {{entity}} hozzárendelése',
    'field-assignedTenant-label': 'Kijelölt Bérlő',
    'nav-tenantSelector-label': 'Bérlő',
  },
}

export const hu: PluginLanguage = {
  dateFNSKey: 'hu',
  translations: huTranslations,
}
