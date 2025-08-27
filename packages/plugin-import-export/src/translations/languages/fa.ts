import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const faTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'تمام مکان ها',
    exportDocumentLabel: 'صادر کردن {{label}}',
    exportOptions: 'گزینه های صادرات',
    'field-depth-label': 'عمق',
    'field-drafts-label': 'شامل پیش نویس ها',
    'field-fields-label': 'مزارع',
    'field-format-label': 'فرمت صادرات',
    'field-limit-label': 'محدودیت',
    'field-locale-label': 'محلی',
    'field-name-label': 'نام فایل',
    'field-page-label': 'صفحه',
    'field-selectionToUse-label': 'انتخاب برای استفاده',
    'field-sort-label': 'مرتب سازی بر اساس',
    'field-sort-order-label': 'ترتیب',
    'selectionToUse-allDocuments': 'از تمام مستندات استفاده کنید',
    'selectionToUse-currentFilters': 'از فیلترهای فعلی استفاده کنید',
    'selectionToUse-currentSelection': 'از انتخاب فعلی استفاده کنید',
    totalDocumentsCount: '{{count}} سند کل',
  },
}

export const fa: PluginLanguage = {
  dateFNSKey: 'fa-IR',
  translations: faTranslations,
}
