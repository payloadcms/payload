import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const rsLatinTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Sve lokalne postavke',
    exportDocumentLabel: 'Izvoz {{label}}',
    exportOptions: 'Opcije izvoza',
    'field-depth-label': 'Dubina',
    'field-drafts-label': 'Uključite nacrte',
    'field-fields-label': 'Polja',
    'field-format-label': 'Format izvoza',
    'field-limit-label': 'Ograničenje',
    'field-locale-label': 'Lokalitet',
    'field-name-label': 'Ime datoteke',
    'field-page-label': 'Strana',
    'field-selectionToUse-label': 'Izbor za upotrebu',
    'field-sort-label': 'Sortiraj po',
    'field-sort-order-label': 'Redoslijed sortiranja',
    'selectionToUse-allDocuments': 'Koristite sve dokumente',
    'selectionToUse-currentFilters': 'Koristite trenutne filtere',
    'selectionToUse-currentSelection': 'Koristi trenutni izbor',
    totalDocumentsCount: '{{count}} ukupno dokumenata',
  },
}

export const rsLatin: PluginLanguage = {
  dateFNSKey: 'rs-Latin',
  translations: rsLatinTranslations,
}
