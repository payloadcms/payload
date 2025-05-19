import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const faTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'شما در حال تغییر مالکیت از <0>{{fromTenant}}</0> به <0>{{toTenant}}</0> هستید',
    'confirm-tenant-switch--heading': 'تایید تغییر {{tenantLabel}}',
    'field-assignedTentant-label': 'مستاجر اختصاص یافته',
  },
}

export const fa: PluginLanguage = {
  dateFNSKey: 'fa-IR',
  translations: faTranslations,
}
