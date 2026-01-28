import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ukTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Призначити орендаря',
    'assign-tenant-modal-title': 'Призначте "{{title}}"',
    'field-assignedTenant-label': 'Призначений орендар',
    'nav-tenantSelector-label': 'Орендар',
  },
}

export const uk: PluginLanguage = {
  dateFNSKey: 'uk',
  translations: ukTranslations,
}
