import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTwTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      '您即將從<0>{{fromTenant}}</0>變更所有權至<0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': '確認變更 {{tenantLabel}}',
    'field-assignedTenant-label': '指派的租用戶',
    'nav-tenantSelector-label': '租戶',
  },
}

export const zhTw: PluginLanguage = {
  dateFNSKey: 'zh-TW',
  translations: zhTwTranslations,
}
