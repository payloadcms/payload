import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const hrTranslations: PluginDefaultTranslationsObject = {
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
    'field-name-label': 'Naziv datoteke',
    'field-page-label': 'Stranica',
    'field-selectionToUse-label': 'Odabir za upotrebu',
    'field-sort-label': 'Sortiraj po',
    'field-sort-order-label': 'Redoslijed sortiranja',
    'selectionToUse-allDocuments': 'Koristite sve dokumente',
    'selectionToUse-currentFilters': 'Koristite trenutne filtre',
    'selectionToUse-currentSelection': 'Koristite trenutni odabir',
    totalDocumentsCount: '{{count}} ukupno dokumenata',
  },
}

export const hr: PluginLanguage = {
  dateFNSKey: 'hr',
  translations: hrTranslations,
}
