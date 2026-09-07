import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const fiTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'Määritä vuokralainen',
    'assign-tenant-modal-title': 'Määritä "{{title}}"',
    'field-assignedTenant-label': 'Määritetty vuokralainen',
    'nav-tenantSelector-label': 'Suodata vuokralaisen mukaan',
  },
}

export const fi: PluginLanguage = {
  dateFNSKey: 'fi',
  translations: fiTranslations,
}
