import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const caTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Assignar Tenant',
    'assign-tenant-modal-title': 'Assigna "{{title}}"',
    'field-assignedTenant-label': 'Llogater Assignat',
    'nav-tenantSelector-label': 'Inquilí',
  },
}

export const ca: PluginLanguage = {
  dateFNSKey: 'ca',
  translations: caTranslations,
}
