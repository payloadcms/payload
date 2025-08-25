import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const koTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: '모든 지역 설정',
    exportDocumentLabel: '{{label}} 내보내기',
    exportOptions: '수출 옵션',
    'field-depth-label': '깊이',
    'field-drafts-label': '초안을 포함하십시오.',
    'field-fields-label': '필드',
    'field-format-label': '수출 형식',
    'field-limit-label': '한계',
    'field-locale-label': '지역',
    'field-name-label': '파일 이름',
    'field-page-label': '페이지',
    'field-selectionToUse-label': '사용할 선택',
    'field-sort-label': '정렬 방식',
    'field-sort-order-label': '정렬 순서',
    'selectionToUse-allDocuments': '모든 문서를 사용하십시오.',
    'selectionToUse-currentFilters': '현재 필터를 사용하십시오.',
    'selectionToUse-currentSelection': '현재 선택 항목을 사용하십시오.',
    totalDocumentsCount: '{{count}}개의 총 문서',
  },
}

export const ko: PluginLanguage = {
  dateFNSKey: 'ko',
  translations: koTranslations,
}
