import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ruTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Все локали',
    exportDocumentLabel: 'Экспорт {{label}}',
    exportOptions: 'Опции экспорта',
    'field-depth-label': 'Глубина',
    'field-drafts-label': 'Включить черновики',
    'field-fields-label': 'Поля',
    'field-format-label': 'Формат экспорта',
    'field-limit-label': 'Лимит',
    'field-locale-label': 'Локаль',
    'field-name-label': 'Имя файла',
    'field-page-label': 'Страница',
    'field-selectionToUse-label': 'Выбор использования',
    'field-sort-label': 'Сортировать по',
    'field-sort-order-label': 'Порядок сортировки',
    'selectionToUse-allDocuments': 'Используйте все документы',
    'selectionToUse-currentFilters': 'Использовать текущие фильтры',
    'selectionToUse-currentSelection': 'Использовать текущий выбор',
    totalDocumentsCount: '{{count}} общее количество документов',
  },
}

export const ru: PluginLanguage = {
  dateFNSKey: 'ru',
  translations: ruTranslations,
}
