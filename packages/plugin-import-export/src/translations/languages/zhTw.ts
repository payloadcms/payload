import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTwTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: '所有地區',
    exportDocumentLabel: '匯出 {{label}}',
    exportOptions: '出口選項',
    'field-depth-label': '深度',
    'field-drafts-label': '包含草稿',
    'field-fields-label': '田野',
    'field-format-label': '出口格式',
    'field-limit-label': '限制',
    'field-locale-label': '地區設定',
    'field-name-label': '檔案名稱',
    'field-selectionToUse-label': '使用選擇',
    'field-sort-label': '按照排序',
    'selectionToUse-allDocuments': '使用所有文件',
    'selectionToUse-currentFilters': '使用當前過濾器',
    'selectionToUse-currentSelection': '使用當前選擇',
    totalDocumentsCount: '{{count}} 總文件數',
  },
}

export const zhTw: PluginLanguage = {
  dateFNSKey: 'zh-TW',
  translations: zhTwTranslations,
}
