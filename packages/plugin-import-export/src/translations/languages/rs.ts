import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const rsTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Sve lokacije',
    exportDocumentLabel: 'Извоз {{label}}',
    exportOptions: 'Опције извоза',
    'field-depth-label': 'Dubina',
    'field-drafts-label': 'Uključite nacrte',
    'field-fields-label': 'Polja',
    'field-format-label': 'Format izvoza',
    'field-limit-label': 'Ograničenje',
    'field-locale-label': 'Локалитет',
    'field-name-label': 'Ime datoteke',
    'field-page-label': 'Strana',
    'field-selectionToUse-label': 'Izbor za upotrebu',
    'field-sort-label': 'Sortiraj po',
    'field-sort-order-label': 'Redoslijed sortiranja',
    'selectionToUse-allDocuments': 'Koristite sve dokumente',
    'selectionToUse-currentFilters': 'Koristite trenutne filtere',
    'selectionToUse-currentSelection': 'Koristite trenutni izbor',
    totalDocumentsCount: '{{count}} ukupno dokumenata',
  },
}

export const rs: PluginLanguage = {
  dateFNSKey: 'rs',
  translations: rsTranslations,
}
