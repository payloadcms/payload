import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: '所有语言环境',
    exportDocumentLabel: '导出{{label}}',
    exportOptions: '导出选项',
    'field-depth-label': '深度',
    'field-drafts-label': '包括草稿',
    'field-fields-label': '字段',
    'field-format-label': '导出格式',
    'field-limit-label': '限制',
    'field-locale-label': '语言环境',
    'field-name-label': '文件名',
    'field-page-label': '页面',
    'field-selectionToUse-label': '选择范围',
    'field-sort-label': '排序方式',
    'field-sort-order-label': '排序顺序',
    'selectionToUse-allDocuments': '使用所有文档',
    'selectionToUse-currentFilters': '使用当前过滤条件',
    'selectionToUse-currentSelection': '使用当前选择',
    totalDocumentsCount: '总共{{count}}份文件',
  },
}

export const zh: PluginLanguage = {
  dateFNSKey: 'zh-CN',
  translations: zhTranslations,
}
