import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTwTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      '您即將變更擁有者，從 <0>{{fromTenant}}</0> 切換為 <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': '確認變更 {{tenantLabel}}',
    'field-assignedTentant-label': '指派的租用戶',
  },
}

export const zhTw: PluginLanguage = {
  dateFNSKey: 'zh-TW',
  translations: zhTwTranslations,
}
