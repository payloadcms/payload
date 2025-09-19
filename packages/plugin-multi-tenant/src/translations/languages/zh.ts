import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description': '设置此文档的所有权。更新以下选择并确认您的更改。',
    'assign-document-modal-title': '分配文档',
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
