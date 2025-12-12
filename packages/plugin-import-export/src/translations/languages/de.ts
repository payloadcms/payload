import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const deTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Alle Sprachvarianten',
    exportDocumentLabel: 'Export {{label}}',
    exportOptions: 'Exportoptionen',
    'field-depth-label': 'Tiefe',
    'field-drafts-label': 'Entwürfe inkludieren',
    'field-fields-label': 'Felder',
    'field-format-label': 'Exportformat',
    'field-limit-label': 'Limit',
    'field-locale-label': 'Sprachvariante',
    'field-name-label': 'Dateiname',
    'field-page-label': 'Seite',
    'field-selectionToUse-label': 'Auswahl zur Verwendung',
    'field-sort-label': 'Sortieren nach',
    'field-sort-order-label': 'Sortierreihenfolge',
    'selectionToUse-allDocuments': 'Alle Dokumente verwenden',
    'selectionToUse-currentFilters': 'Aktuelle Filter verwenden',
    'selectionToUse-currentSelection': 'Aktuelle Auswahl verwenden',
    totalDocumentsCount: '{{count}} Dokumente insgesamt',
  },
}

export const de: PluginLanguage = {
  dateFNSKey: 'de',
  translations: deTranslations,
}
