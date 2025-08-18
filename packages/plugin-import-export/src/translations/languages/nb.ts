import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const nbTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Alle steder',
    exportDocumentLabel: 'Eksporter {{label}}',
    exportOptions: 'Eksportalternativer',
    'field-depth-label': 'Dybde',
    'field-drafts-label': 'Inkluder utkast',
    'field-fields-label': 'Felt',
    'field-format-label': 'Eksportformat',
    'field-limit-label': 'Begrensning',
    'field-locale-label': 'Lokal',
    'field-name-label': 'Filnavn',
    'field-page-label': 'Side',
    'field-selectionToUse-label': 'Valg til bruk',
    'field-sort-label': 'Sorter etter',
    'field-sort-order-label': 'Sorteringsrekkefølge',
    'selectionToUse-allDocuments': 'Bruk alle dokumentene',
    'selectionToUse-currentFilters': 'Bruk gjeldende filtre',
    'selectionToUse-currentSelection': 'Bruk gjeldende utvalg',
    totalDocumentsCount: '{{count}} totalt dokumenter',
  },
}

export const nb: PluginLanguage = {
  dateFNSKey: 'nb',
  translations: nbTranslations,
}
