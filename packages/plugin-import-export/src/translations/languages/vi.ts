import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const viTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Tất cả địa điểm',
    exportDocumentLabel: 'Xuất {{label}}',
    exportOptions: 'Tùy chọn xuất',
    'field-depth-label': 'Độ sâu',
    'field-drafts-label': 'Bao gồm bản thảo',
    'field-fields-label': 'Cánh đồng',
    'field-format-label': 'Định dạng Xuất khẩu',
    'field-limit-label': 'Giới hạn',
    'field-locale-label': 'Địa phương',
    'field-name-label': 'Tên tệp',
    'field-selectionToUse-label': 'Lựa chọn để sử dụng',
    'field-sort-label': 'Sắp xếp theo',
    'selectionToUse-allDocuments': 'Sử dụng tất cả các tài liệu',
    'selectionToUse-currentFilters': 'Sử dụng bộ lọc hiện tại',
    'selectionToUse-currentSelection': 'Sử dụng lựa chọn hiện tại',
    totalDocumentsCount: '{{count}} tổng số tài liệu',
  },
}

export const vi: PluginLanguage = {
  dateFNSKey: 'vi',
  translations: viTranslations,
}
