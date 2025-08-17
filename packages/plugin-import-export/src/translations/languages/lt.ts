import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const ltTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Visos vietovės',
    exportDocumentLabel: 'Eksportuoti {{label}}',
    exportOptions: 'Eksporto parinktys',
    'field-depth-label': 'Gylis',
    'field-drafts-label': 'Įtraukite juodraščius',
    'field-fields-label': 'Laukai',
    'field-format-label': 'Eksporto formatas',
    'field-limit-label': 'Ribos',
    'field-locale-label': 'Lokalė',
    'field-name-label': 'Failo pavadinimas',
    'field-page-label': 'Puslapis',
    'field-selectionToUse-label': 'Naudojimo pasirinkimas',
    'field-sort-label': 'Rūšiuoti pagal',
    'field-sort-order-label': 'Rūšiavimo tvarka',
    'selectionToUse-allDocuments': 'Naudokite visus dokumentus.',
    'selectionToUse-currentFilters': 'Naudoti esamus filtrus',
    'selectionToUse-currentSelection': 'Naudoti dabartinį pasirinkimą',
    totalDocumentsCount: '{{count}} viso dokumentų',
  },
}

export const lt: PluginLanguage = {
  dateFNSKey: 'lt',
  translations: ltTranslations,
}
