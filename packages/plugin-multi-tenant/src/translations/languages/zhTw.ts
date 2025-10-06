import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTwTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-tenant-button-label': '指派租戶',
    'assign-tenant-modal-title': '將 "{{title}}"',
    'field-assignedTenant-label': '指派的租用戶',
    'nav-tenantSelector-label': '租戶',
  },
}

export const zhTw: PluginLanguage = {
  dateFNSKey: 'zh-TW',
  translations: zhTwTranslations,
}
