import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ukTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Всі локалі',
    exportDocumentLabel: 'Експорт {{label}}',
    exportOptions: 'Опції експорту',
    'field-depth-label': 'Глибина',
    'field-drafts-label': 'Включити чернетки',
    'field-fields-label': 'Поля',
    'field-format-label': 'Формат експорту',
    'field-limit-label': 'Обмеження',
    'field-locale-label': 'Локалізація',
    'field-name-label': 'Назва файлу',
    'field-page-label': 'Сторінка',
    'field-selectionToUse-label': 'Вибір для використання',
    'field-sort-label': 'Сортувати за',
    'field-sort-order-label': 'Сортувати за порядком',
    'selectionToUse-allDocuments': 'Використовуйте всі документи',
    'selectionToUse-currentFilters': 'Використовувати поточні фільтри',
    'selectionToUse-currentSelection': 'Використовуйте поточний вибір',
    totalDocumentsCount: '{{count}} всього документів',
  },
}

export const uk: PluginLanguage = {
  dateFNSKey: 'uk',
  translations: ukTranslations,
}
