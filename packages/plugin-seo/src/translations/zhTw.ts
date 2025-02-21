import type { GenericTranslationsObject } from '@payloadcms/translations'

export const zhTw: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: '快完成了',
    autoGenerate: '自動生成',
    bestPractices: '最佳實踐',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} 字符, ',
    charactersLeftOver: '{{characters}} 字符剩餘',
    charactersToGo: '{{characters}} 字符待輸入',
    charactersTooMany: '{{characters}} 字符太多',
    checksPassing: '{{current}}/{{max}} 檢查通過',
    good: '好',
    imageAutoGenerationTip: '自動生成將獲取選定的主圖像。',
    lengthTipDescription:
      '此文本應介於 {{minLength}} 和 {{maxLength}} 個字符之間。如需有關編寫高質量 meta 描述的幫助，請參見 ',
    lengthTipTitle:
      '此文本應介於 {{minLength}} 和 {{maxLength}} 個字符之間。如需有關編寫高質量 meta 標題的幫助，請參見 ',
    missing: '缺失',
    noImage: '沒有圖片',
    preview: '預覽',
    previewDescription: '實際搜尋結果可能會根據內容和搜尋相關性有所不同。',
    tooLong: '太長',
    tooShort: '太短',
  },
}
