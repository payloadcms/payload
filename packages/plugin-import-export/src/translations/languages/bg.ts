import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const bgTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Всички локации',
    exportDocumentLabel: 'Експортиране {{label}}',
    exportOptions: 'Опции за експортиране',
    'field-depth-label': 'Дълбочина',
    'field-drafts-label': 'Включете чернови',
    'field-fields-label': 'Полета',
    'field-format-label': 'Формат за експортиране',
    'field-limit-label': 'Лимит',
    'field-locale-label': 'Регион',
    'field-name-label': 'Име на файла',
    'field-page-label': 'Страница',
    'field-selectionToUse-label': 'Избор за използване',
    'field-sort-label': 'Сортирай по',
    'field-sort-order-label': 'Ред на сортиране',
    'selectionToUse-allDocuments': 'Използвайте всички документи',
    'selectionToUse-currentFilters': 'Използвайте текущите филтри',
    'selectionToUse-currentSelection': 'Използвайте текущия избор',
    totalDocumentsCount: '{{count}} общо документа',
  },
}

export const bg: PluginLanguage = {
  dateFNSKey: 'bg',
  translations: bgTranslations,
}
