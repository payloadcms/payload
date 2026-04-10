import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const plTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Przypisz Najemcę',
    'assign-tenant-modal-title': 'Przypisz "{{title}}"',
    'field-assignedTenant-label': 'Przypisany Najemca',
    'nav-tenantSelector-label': 'Najemca',
  },
}

export const pl: PluginLanguage = {
  dateFNSKey: 'pl',
  translations: plTranslations,
}
