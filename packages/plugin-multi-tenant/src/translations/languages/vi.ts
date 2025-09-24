import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const viTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      'Bạn sắp chuyển quyền sở hữu từ <0>{{fromTenant}}</0> đến <0>{{toTenant}}</0>',
    'confirm-modal-tenant-switch--heading': 'Xác nhận thay đổi {{tenantLabel}}',
    'field-assignedTenant-label': 'Người thuê đã được chỉ định',
    'nav-tenantSelector-label': 'Người thuê',
  },
}

export const vi: PluginLanguage = {
  dateFNSKey: 'vi',
  translations: viTranslations,
}
