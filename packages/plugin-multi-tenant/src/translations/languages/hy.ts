import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const hyTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Դուք պատրաստվում եք փոխել սեփականությունը <0>{{fromTenant}}</0>-ից <0>{{toTenant}}</0>-ին:',
    'confirm-modal-tenant-switch--heading': 'Հաստատեք {{tenantLabel}}֊ի փոփոխությունը',
    'field-assignedTenant-label': 'Հանձնարարված վարձակալ',
    'nav-tenantSelector-label': 'Տենանտ',
  },
}

export const hy: PluginLanguage = {
  dateFNSKey: 'hy-AM',
  translations: hyTranslations,
}
