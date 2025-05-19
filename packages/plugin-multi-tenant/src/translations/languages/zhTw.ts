import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTwTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      '您即將將所有權從 <0>{{fromTenant}}</0> 轉移至 <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': '確認{{tenantLabel}}更改',
    'field-assignedTentant-label': '指定的租戶',
  },
}

export const zhTw: PluginLanguage = {
  dateFNSKey: 'zh-TW',
  translations: zhTwTranslations,
}
