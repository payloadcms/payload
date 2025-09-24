import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ptTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Atribuir Inquilino',
    'assign-tenant-modal-title': 'Atribuir "{{title}}"',
    'field-assignedTenant-label': 'Inquilino Atribuído',
    'nav-tenantSelector-label': 'Inquilino',
  },
}

export const pt: PluginLanguage = {
  dateFNSKey: 'pt',
  translations: ptTranslations,
}
