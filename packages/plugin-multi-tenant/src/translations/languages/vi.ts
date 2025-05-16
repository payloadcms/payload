import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const viTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      'Bạn đang chuẩn bị chuyển quyền sở hữu từ <0>{{fromTenant}}</0> sang <0>{{toTenant}}</0>',
    'confirm-tenant-switch--heading': 'Xác nhận thay đổi {{tenantLabel}}',
  },
}

export const vi: PluginLanguage = {
  dateFNSKey: 'vi',
  translations: viTranslations,
}
