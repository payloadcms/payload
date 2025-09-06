import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const daTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Alle lokaliteter',
    exportDocumentLabel: 'Eksport {{label}}',
    exportOptions: 'Eksportmuligheder',
    'field-depth-label': 'Dybde',
    'field-drafts-label': 'Inkluder udkast',
    'field-fields-label': 'Felter',
    'field-format-label': 'Eksportformat',
    'field-limit-label': 'Begrænsning',
    'field-locale-label': 'Lokale',
    'field-name-label': 'Filnavn',
    'field-page-label': 'Side',
    'field-selectionToUse-label': 'Valg til brug',
    'field-sort-label': 'Sorter efter',
    'field-sort-order-label': 'Sorteringsrækkefølge',
    'selectionToUse-allDocuments': 'Brug alle dokumenter',
    'selectionToUse-currentFilters': 'Brug nuværende filtre',
    'selectionToUse-currentSelection': 'Brug nuværende valg',
    totalDocumentsCount: '{{count}} samlede dokumenter',
  },
}

export const da: PluginLanguage = {
  dateFNSKey: 'da',
  translations: daTranslations,
}
