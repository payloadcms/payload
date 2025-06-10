import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTwTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: '所有地區',
    exportDocumentLabel: '匯出 {{label}}',
    exportOptions: '匯出選項',
    'field-depth-label': '深度',
    'field-drafts-label': '包含草稿',
    'field-fields-label': '欄位',
    'field-format-label': '匯出格式',
    'field-limit-label': '筆數限制',
    'field-locale-label': '語言/地區',
    'field-name-label': '檔案名稱',
    'field-selectionToUse-label': '選擇範圍',
    'field-sort-label': '排序方式',
    'selectionToUse-allDocuments': '使用所有文件',
    'selectionToUse-currentFilters': '使用目前篩選條件',
    'selectionToUse-currentSelection': '使用目前選擇',
    totalDocumentsCount: '共 {{count}} 筆文件',
  },
}

export const zhTw: PluginLanguage = {
  dateFNSKey: 'zh-TW',
  translations: zhTwTranslations,
}
