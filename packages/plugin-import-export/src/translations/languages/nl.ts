import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const nlTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Alle locaties',
    exportDocumentLabel: 'Exporteer {{label}}',
    exportOptions: 'Exportmogelijkheden',
    'field-depth-label': 'Diepte',
    'field-drafts-label': 'Voeg ontwerpen toe',
    'field-fields-label': 'Velden',
    'field-format-label': 'Exportformaat',
    'field-limit-label': 'Limiet',
    'field-locale-label': 'Lokale',
    'field-name-label': 'Bestandsnaam',
    'field-page-label': 'Pagina',
    'field-selectionToUse-label': 'Selectie om te gebruiken',
    'field-sort-label': 'Sorteer op',
    'field-sort-order-label': 'Sorteer volgorde',
    'selectionToUse-allDocuments': 'Gebruik alle documenten',
    'selectionToUse-currentFilters': 'Gebruik huidige filters',
    'selectionToUse-currentSelection': 'Gebruik huidige selectie',
    totalDocumentsCount: '{{count}} totaal aantal documenten',
  },
}

export const nl: PluginLanguage = {
  dateFNSKey: 'nl',
  translations: nlTranslations,
}
