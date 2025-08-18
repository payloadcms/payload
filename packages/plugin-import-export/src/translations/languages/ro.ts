import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const roTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Toate locațiile',
    exportDocumentLabel: 'Export {{label}}',
    exportOptions: 'Opțiuni de export',
    'field-depth-label': 'Adâncime',
    'field-drafts-label': 'Includează schițe',
    'field-fields-label': 'Campuri',
    'field-format-label': 'Format de export',
    'field-limit-label': 'Limită',
    'field-locale-label': 'Localizare',
    'field-name-label': 'Numele fișierului',
    'field-page-label': 'Pagina',
    'field-selectionToUse-label': 'Selectarea pentru utilizare',
    'field-sort-label': 'Sortează după',
    'field-sort-order-label': 'Ordine de sortare',
    'selectionToUse-allDocuments': 'Utilizați toate documentele.',
    'selectionToUse-currentFilters': 'Utilizați filtrele curente',
    'selectionToUse-currentSelection': 'Utilizați selecția curentă',
    totalDocumentsCount: '{{count}} documente totale',
  },
}

export const ro: PluginLanguage = {
  dateFNSKey: 'ro',
  translations: roTranslations,
}
