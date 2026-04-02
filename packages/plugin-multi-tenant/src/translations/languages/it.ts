import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const itTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Assegna Tenant',
    'assign-tenant-modal-title': 'Assegna "{{title}}"',
    'field-assignedTenant-label': 'Inquilino Assegnato',
    'nav-tenantSelector-label': 'Inquilino',
  },
}

export const it: PluginLanguage = {
  dateFNSKey: 'it',
  translations: itTranslations,
}
