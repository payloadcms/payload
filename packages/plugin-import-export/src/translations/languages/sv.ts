import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const svTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Alla platser',
    exportDocumentLabel: 'Exportera {{label}}',
    exportOptions: 'Exportalternativ',
    'field-depth-label': 'Djup',
    'field-drafts-label': 'Inkludera utkast',
    'field-fields-label': 'Fält',
    'field-format-label': 'Exportformat',
    'field-limit-label': 'Begränsning',
    'field-locale-label': 'Lokal',
    'field-name-label': 'Filnamn',
    'field-page-label': 'Sida',
    'field-selectionToUse-label': 'Val att använda',
    'field-sort-label': 'Sortera efter',
    'field-sort-order-label': 'Sortera i ordning',
    'selectionToUse-allDocuments': 'Använd alla dokument',
    'selectionToUse-currentFilters': 'Använd aktuella filter',
    'selectionToUse-currentSelection': 'Använd nuvarande urval',
    totalDocumentsCount: '{{count}} totala dokument',
  },
}

export const sv: PluginLanguage = {
  dateFNSKey: 'sv',
  translations: svTranslations,
}
