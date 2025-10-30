import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const taTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'டெனன்டை ஒதுக்குக',
    'assign-tenant-modal-title': '"{{title}}"ஐ ஒதுக்கி வைக்கவும்.',
    'field-assignedTenant-label': 'ஒதுக்கப்பட்ட Tenant',
    'nav-tenantSelector-label': 'Tenant',
  },
}

export const ta: PluginLanguage = {
  dateFNSKey: 'ta',
  translations: taTranslations,
}
