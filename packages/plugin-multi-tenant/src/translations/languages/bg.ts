import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bgTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Предстои да промените собствеността от <0>{{fromTenant}}</0> на <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Потвърждаване на промяна в {{tenantLabel}}',
    'field-assignedTenant-label': 'Назначен наемател',
    'nav-tenantSelector-label': 'Потребител',
  },
}

export const bg: PluginLanguage = {
  dateFNSKey: 'bg',
  translations: bgTranslations,
}
