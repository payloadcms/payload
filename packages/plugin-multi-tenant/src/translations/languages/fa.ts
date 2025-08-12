import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const faTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'شما در حال تغییر مالکیت از <0>{{fromTenant}}</0> به <0>{{toTenant}}</0> هستید.',
    'confirm-modal-tenant-switch--heading': 'تأیید تغییر {{tenantLabel}}',
    'field-assignedTenant-label': 'مستاجر اختصاص یافته',
    'nav-tenantSelector-label': 'مستاجر',
  },
}

export const fa: PluginLanguage = {
  dateFNSKey: 'fa-IR',
  translations: faTranslations,
}
