import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const zhTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: '所有地方',
    exportDocumentLabel: '导出{{label}}',
    exportOptions: '导出选项',
    'field-depth-label': '深度',
    'field-drafts-label': '包括草稿',
    'field-fields-label': '领域',
    'field-format-label': '导出格式',
    'field-limit-label': '限制',
    'field-locale-label': '地区设置',
    'field-name-label': '文件名',
    'field-selectionToUse-label': '使用选择',
    'field-sort-label': '按排序',
    'selectionToUse-allDocuments': '使用所有文档',
    'selectionToUse-currentFilters': '使用当前过滤器',
    'selectionToUse-currentSelection': '使用当前选择',
    totalDocumentsCount: '{{count}}份总文件',
  },
}

export const zh: PluginLanguage = {
  dateFNSKey: 'zh-CN',
  translations: zhTranslations,
}
