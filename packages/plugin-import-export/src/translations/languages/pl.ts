import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const plTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Wszystkie lokalizacje',
    exportDocumentLabel: 'Eksportuj {{label}}',
    exportOptions: 'Opcje eksportu',
    'field-depth-label': 'Głębokość',
    'field-drafts-label': 'Dołącz szkice',
    'field-fields-label': 'Pola',
    'field-format-label': 'Format eksportu',
    'field-limit-label': 'Limit',
    'field-locale-label': 'Lokalizacja',
    'field-name-label': 'Nazwa pliku',
    'field-page-label': 'Strona',
    'field-selectionToUse-label': 'Wybór do użycia',
    'field-sort-label': 'Sortuj według',
    'field-sort-order-label': 'Sortowanie według',
    'selectionToUse-allDocuments': 'Użyj wszystkich dokumentów.',
    'selectionToUse-currentFilters': 'Użyj aktualnych filtrów',
    'selectionToUse-currentSelection': 'Użyj aktualnego wyboru',
    totalDocumentsCount: '{{count}} łączna liczba dokumentów',
  },
}

export const pl: PluginLanguage = {
  dateFNSKey: 'pl',
  translations: plTranslations,
}
