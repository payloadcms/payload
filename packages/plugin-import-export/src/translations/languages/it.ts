import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const itTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Tutte le località',
    exportDocumentLabel: 'Esporta {{label}}',
    exportOptions: 'Opzioni di Esportazione',
    'field-depth-label': 'Profondità',
    'field-drafts-label': 'Includi bozze',
    'field-fields-label': 'Campi',
    'field-format-label': 'Formato di Esportazione',
    'field-limit-label': 'Limite',
    'field-locale-label': 'Locale',
    'field-name-label': 'Nome del file',
    'field-page-label': 'Pagina',
    'field-selectionToUse-label': 'Selezione da utilizzare',
    'field-sort-label': 'Ordina per',
    'field-sort-order-label': 'Ordine di sort',
    'selectionToUse-allDocuments': 'Utilizza tutti i documenti',
    'selectionToUse-currentFilters': 'Utilizza i filtri correnti',
    'selectionToUse-currentSelection': 'Utilizza la selezione corrente',
    totalDocumentsCount: '{{count}} documenti totali',
  },
}

export const it: PluginLanguage = {
  dateFNSKey: 'it',
  translations: itTranslations,
}
