import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTwTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description': '設定此文檔的所有權。更新下方的選擇並確認您的更改。',
    'assign-document-modal-title': '指派文件',
    'confirm-modal-tenant-switch--body':
      '您即將變更擁有者，從 <0>{{fromTenant}}</0> 切換為 <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': '確認變更 {{tenantLabel}}',
    'field-assignedTenant-label': '指派的租用戶',
    'nav-tenantSelector-label': '租戶',
  },
}

export const zhTw: PluginLanguage = {
  dateFNSKey: 'zh-TW',
  translations: zhTwTranslations,
}
