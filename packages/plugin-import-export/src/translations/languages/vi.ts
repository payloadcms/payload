import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const viTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Tất cả ngôn ngữ',
    exportDocumentLabel: 'Xuất {{label}}',
    exportOptions: 'Tùy chọn xuất',
    'field-depth-label': 'Độ sâu',
    'field-drafts-label': 'Bao gồm bản thảo',
    'field-fields-label': 'Trường',
    'field-format-label': 'Định dạng xuất',
    'field-limit-label': 'Giới hạn',
    'field-locale-label': 'Ngôn ngữ',
    'field-name-label': 'Tên tệp',
    'field-page-label': 'Trang',
    'field-selectionToUse-label': 'Chọn để sử dụng',
    'field-sort-label': 'Sắp xếp theo',
    'field-sort-order-label': 'Sắp xếp theo thứ tự',
    'selectionToUse-allDocuments': 'Dùng tất cả',
    'selectionToUse-currentFilters': 'Dùng bộ lọc hiện tại',
    'selectionToUse-currentSelection': 'Dùng đang chọn',
    totalDocumentsCount: 'Tổng cộng {{count}} tài liệu',
  },
}

export const vi: PluginLanguage = {
  dateFNSKey: 'vi',
  translations: viTranslations,
}
