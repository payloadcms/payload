import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const arTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'تعيين المستأجر',
    'assign-tenant-modal-fallback-title': 'قم بتعيين {{entity}} جديد',
    'field-assignedTenant-label': 'المستأجر المعين',
    'nav-tenantSelector-label': 'المستأجر',
  },
}

export const ar: PluginLanguage = {
  dateFNSKey: 'ar',
  translations: arTranslations,
}
