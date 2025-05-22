import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body': '您即将将所有权从<0>{{fromTenant}}</0>更改为<0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': '确认更改{{tenantLabel}}',
    'field-assignedTentant-label': '指定租户',
  },
}

export const zh: PluginLanguage = {
  dateFNSKey: 'zh-CN',
  translations: zhTranslations,
}
