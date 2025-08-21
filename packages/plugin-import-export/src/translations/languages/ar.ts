import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const arTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'جميع المواقع',
    exportDocumentLabel: 'تصدير {{label}}',
    exportOptions: 'خيارات التصدير',
    'field-depth-label': 'عمق',
    'field-drafts-label': 'تضمن المسودات',
    'field-fields-label': 'حقول',
    'field-format-label': 'تنسيق التصدير',
    'field-limit-label': 'حد',
    'field-locale-label': 'موقع',
    'field-name-label': 'اسم الملف',
    'field-page-label': 'صفحة',
    'field-selectionToUse-label': 'اختيار للاستخدام',
    'field-sort-label': 'ترتيب حسب',
    'field-sort-order-label': 'ترتيب',
    'selectionToUse-allDocuments': 'استخدم جميع الوثائق',
    'selectionToUse-currentFilters': 'استخدم الفلاتر الحالية',
    'selectionToUse-currentSelection': 'استخدم الاختيار الحالي',
    totalDocumentsCount: '{{count}} مستنداً إجمالياً',
  },
}

export const ar: PluginLanguage = {
  dateFNSKey: 'ar',
  translations: arTranslations,
}
