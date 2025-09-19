import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ukTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'Встановіть власність цього документа. Оновіть вибір нижче та підтвердіть свої зміни.',
    'assign-document-modal-title': 'Призначити Документ',
    'confirm-modal-tenant-switch--body':
      'Ви збираєтеся змінити власність з <0>{{fromTenant}}</0> на <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Підтвердіть зміну {{tenantLabel}}',
    'field-assignedTenant-label': 'Призначений орендар',
    'nav-tenantSelector-label': 'Орендар',
  },
}

export const uk: PluginLanguage = {
  dateFNSKey: 'uk',
  translations: ukTranslations,
}
