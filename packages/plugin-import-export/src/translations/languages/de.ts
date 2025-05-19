import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const deTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Alle Gebietsschemata',
    exportDocumentLabel: 'Export {{label}}',
    exportOptions: 'Exportoptionen',
    'field-depth-label': 'Tiefe',
    'field-drafts-label': 'Fügen Sie Entwürfe hinzu',
    'field-fields-label': 'Felder',
    'field-format-label': 'Exportformat',
    'field-limit-label': 'Grenze',
    'field-locale-label': 'Ort',
    'field-name-label': 'Dateiname',
    'field-selectionToUse-label': 'Auswahl zur Verwendung',
    'field-sort-label': 'Sortieren nach',
    'selectionToUse-allDocuments': 'Verwenden Sie alle Dokumente.',
    'selectionToUse-currentFilters': 'Verwenden Sie aktuelle Filter',
    'selectionToUse-currentSelection': 'Verwenden Sie die aktuelle Auswahl',
    totalDocumentsCount: '{{count}} gesamte Dokumente',
  },
}

export const de: PluginLanguage = {
  dateFNSKey: 'de',
  translations: deTranslations,
}
