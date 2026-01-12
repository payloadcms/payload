import type { GenericTranslationsObject } from '@payloadcms/translations'

export const ko: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: '거의 완료',
    autoGenerate: '자동 생성',
    bestPractices: '모범 사례',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} 자, ',
    charactersLeftOver: '{{characters}} 자 초과',
    charactersToGo: '{{characters}} 자 남음',
    charactersTooMany: '{{characters}} 자 초과',
    checksPassing: '{{current}}/{{max}}개의 검사를 통과했습니다',
    good: '좋음',
    imageAutoGenerationTip: '자동 생성은 선택한 대표 이미지를 가져옵니다.',
    lengthTipDescription:
      '이 값은 {{minLength}}자에서 {{maxLength}}자 사이여야 합니다. 품질 높은 메타 설명 작성에 대한 도움말은 ',
    lengthTipTitle:
      '이 값은 {{minLength}}자에서 {{maxLength}}자 사이여야 합니다. 품질 높은 메타 제목 작성에 대한 도움말은 ',
    missing: '누락됨',
    noImage: '이미지 없음',
    preview: '미리 보기',
    previewDescription: '정확한 검색 결과 목록은 콘텐츠 및 검색 적합성에 따라 달라질 수 있습니다.',
    tooLong: '너무 김',
    tooShort: '너무 짧음',
  },
}
