import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const faTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'اختصاص Tenant',
    'assign-tenant-modal-title': 'اختصاص "{{title}}"',
    'field-assignedTenant-label': 'مستاجر اختصاص یافته',
    'nav-tenantSelector-label': 'مستاجر',
  },
}

export const fa: PluginLanguage = {
  dateFNSKey: 'fa-IR',
  translations: faTranslations,
}
