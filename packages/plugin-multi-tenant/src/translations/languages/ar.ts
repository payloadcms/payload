import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const arTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      'حدد ملكية هذا المستند. قم بتحديث الاختيار أدناه وتأكيد التغييرات الخاصة بك.',
    'assign-document-modal-title': 'تعيين الوثيقة',
    'confirm-modal-tenant-switch--body':
      'أنت على وشك تغيير الملكية من <0>{{fromTenant}}</0> إلى <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'تأكيد تغيير {{tenantLabel}}',
    'field-assignedTenant-label': 'المستأجر المعين',
    'nav-tenantSelector-label': 'المستأجر',
  },
}

export const ar: PluginLanguage = {
  dateFNSKey: 'ar',
  translations: arTranslations,
}
