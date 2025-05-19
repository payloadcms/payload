import type { PluginLanguage } from '../types.js'
export const enTranslations = {
  'plugin-import-export': {
    allLocales: 'All locales',
    exportDocumentLabel: 'Export {{label}}',
    exportOptions: 'Export Options',
    'field-depth-label': 'Depth',
    'field-drafts-label': 'Include drafts',
    'field-fields-label': 'Fields',
    'field-format-label': 'Export Format',
    'field-limit-label': 'Limit',
    'field-locale-label': 'Locale',
    'field-name-label': 'File name',
    'field-selectionToUse-label': 'Selection to use',
    'field-sort-label': 'Sort by',
    'selectionToUse-allDocuments': 'Use all documents',
    'selectionToUse-currentFilters': 'Use current filters',
    'selectionToUse-currentSelection': 'Use current selection',
    totalDocumentsCount: '{{count}} total documents',
  },
}

export const en: PluginLanguage = {
  dateFNSKey: 'en-US',
  translations: enTranslations,
}
