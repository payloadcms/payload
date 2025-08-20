import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const etTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Kõik kohalikud seaded',
    exportDocumentLabel: 'Ekspordi {{label}}',
    exportOptions: 'Ekspordi valikud',
    'field-depth-label': 'Sügavus',
    'field-drafts-label': 'Kaasa arvatud mustandid',
    'field-fields-label': 'Väljad',
    'field-format-label': 'Ekspordi formaat',
    'field-limit-label': 'Piirang',
    'field-locale-label': 'Lokaal',
    'field-name-label': 'Faili nimi',
    'field-page-label': 'Leht',
    'field-selectionToUse-label': 'Valiku kasutamine',
    'field-sort-label': 'Sorteeri järgi',
    'field-sort-order-label': 'Sorteerimise järjekord',
    'selectionToUse-allDocuments': 'Kasutage kõiki dokumente',
    'selectionToUse-currentFilters': 'Kasuta praeguseid filtreid',
    'selectionToUse-currentSelection': 'Kasuta praegust valikut',
    totalDocumentsCount: '{{count}} dokumendi koguarv',
  },
}

export const et: PluginLanguage = {
  dateFNSKey: 'et',
  translations: etTranslations,
}
