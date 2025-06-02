import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const koTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'confirm-tenant-switch--body':
      '<0>{{fromTenant}}</0>에서 <0>{{toTenant}}</0>으로 소유권을 변경하려고 합니다.',
    'confirm-tenant-switch--heading': '{{tenantLabel}} 변경을 확인하세요',
    'field-assignedTentant-label': '지정된 세입자',
  },
}

export const ko: PluginLanguage = {
  dateFNSKey: 'ko',
  translations: koTranslations,
}
