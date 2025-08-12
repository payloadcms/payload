import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      '您即将从<0>{{fromTenant}}</0>更改为<0>{{toTenant}}</0>的所有权',
    'confirm-modal-tenant-switch--heading': '确认更改{{tenantLabel}}',
    'field-assignedTenant-label': '指定租户',
    'nav-tenantSelector-label': '租户',
  },
}

export const zh: PluginLanguage = {
  dateFNSKey: 'zh-CN',
  translations: zhTranslations,
}
