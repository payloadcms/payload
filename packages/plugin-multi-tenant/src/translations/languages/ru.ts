import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ruTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Вы собираетесь изменить владельца с <0>{{fromTenant}}</0> на <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Подтвердите изменение {{tenantLabel}}',
    'field-assignedTentant-label': 'Назначенный Арендатор',
  },
}

export const ru: PluginLanguage = {
  dateFNSKey: 'ru',
  translations: ruTranslations,
}
