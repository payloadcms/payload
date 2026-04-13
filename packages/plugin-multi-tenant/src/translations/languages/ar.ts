import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const arTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': 'تعيين المستأجر',
    'assign-tenant-modal-title': 'قم بتعيين "{{title}}"',
    'field-assignedTenant-label': 'المستأجر المعين',
    'nav-tenantSelector-label': 'المستأجر',
  },
}

export const ar: PluginLanguage = {
  dateFNSKey: 'ar',
  translations: arTranslations,
}
