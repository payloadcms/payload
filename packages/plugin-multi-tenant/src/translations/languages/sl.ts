import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const slTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Dodeli najemnika',
    'assign-tenant-modal-fallback-title': 'Dodeli novo {{entity}}',
    'field-assignedTenant-label': 'Dodeljen najemnik',
    'nav-tenantSelector-label': 'Najemnik',
  },
}

export const sl: PluginLanguage = {
  dateFNSKey: 'sl-SI',
  translations: slTranslations,
}
