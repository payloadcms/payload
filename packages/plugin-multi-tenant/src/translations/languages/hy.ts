import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const hyTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Դուք պատրաստ եք փոխել գերեցդիմատնին ընկերությունը <0>{{fromTenant}}</0>-ից <0>{{toTenant}}</0>-ին',
    'confirm-tenant-switch--heading': 'Հաստատեք {{tenantLabel}} փոփոխությունը',
    'field-assignedTentant-label': 'Հանձնարարված վարձակալ',
  },
}

export const hy: PluginLanguage = {
  dateFNSKey: 'hy-AM',
  translations: hyTranslations,
}
