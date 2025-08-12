import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ruTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Вы собираетесь изменить владельца с <0>{{fromTenant}}</0> на <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Подтвердите изменение {{tenantLabel}}',
    'field-assignedTenant-label': 'Назначенный Арендатор',
    'nav-tenantSelector-label': 'Арендатор',
  },
}

export const ru: PluginLanguage = {
  dateFNSKey: 'ru',
  translations: ruTranslations,
}
