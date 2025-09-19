import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const koTranslations: PluginDefaultTranslationsObject = {
  'plugin-multi-tenant': {
    'assign-document-modal-description':
      '이 문서의 소유권을 설정하세요. 아래 선택사항을 업데이트하고 변경사항을 확인하세요.',
    'assign-document-modal-title': '문서 지정하기',
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
