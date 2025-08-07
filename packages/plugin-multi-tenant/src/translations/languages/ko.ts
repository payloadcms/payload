import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const koTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-modal-tenant-switch--body':
      '<0>{{fromTenant}}</0>에서 <0>{{toTenant}}</0>로 소유권을 변경하려고 합니다.',
    'confirm-modal-tenant-switch--heading': '{{tenantLabel}} 변경 확인',
    'field-assignedTenant-label': '지정된 세입자',
    'nav-tenantSelector-label': '세입자',
  },
}

export const ko: PluginLanguage = {
  dateFNSKey: 'ko',
  translations: koTranslations,
}
