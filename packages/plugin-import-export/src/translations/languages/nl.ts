import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const nlTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Alle locaties',
    collectionRequired: 'Collectie vereist om voorbeeld te tonen',
    documentsToExport: '{{count}} documenten te exporteren',
    documentsToImport: '{{count}} documenten te importeren',
    exportDocumentLabel: 'Exporteer {{label}}',
    exportOptions: 'Exportmogelijkheden',
    'field-collectionSlug-label': 'Collectie',
    'field-depth-label': 'Diepte',
    'field-drafts-label': 'Voeg ontwerpen toe',
    'field-fields-label': 'Velden',
    'field-format-label': 'Exportformaat',
    'field-importMode-create-label': 'Maak nieuwe documenten',
    'field-importMode-label': 'Importmodus',
    'field-importMode-update-label': 'Bestaande documenten bijwerken',
    'field-importMode-upsert-label': 'Maak of update documenten',
    'field-limit-label': 'Limiet',
    'field-locale-label': 'Lokale',
    'field-matchField-description':
      'Veld om te gebruiken voor het matchen van bestaande documenten',
    'field-matchField-label': 'Overeenkomstig veld',
    'field-name-label': 'Bestandsnaam',
    'field-page-label': 'Pagina',
    'field-selectionToUse-label': 'Selectie om te gebruiken',
    'field-sort-label': 'Sorteer op',
    'field-sort-order-label': 'Sorteer volgorde',
    'field-status-label': 'Status',
    'field-summary-label': 'Importoverzicht',
    importDocumentLabel: 'Importeer {{label}}',
    importResults: 'Importresultaten',
    limitCapped: 'Limiet beperkt tot maximaal {{limit}}',
    limitExceededExport: 'Export beperkt tot {{limit}} documenten',
    limitExceededImport:
      'Het importbestand bevat {{count}} documenten, maar de limiet is {{limit}}',
    matchBy: 'Overeenkomen door',
    mode: 'Modus',
    noDataToPreview: 'Geen gegevens om te bekijken',
    previewPageInfo: '{{start}}-{{end}} van {{total}}',
    'selectionToUse-allDocuments': 'Gebruik alle documenten',
    'selectionToUse-currentFilters': 'Gebruik huidige filters',
    'selectionToUse-currentSelection': 'Gebruik huidige selectie',
    startImport: 'Start Importeren',
    totalDocumentsCount: '{{count}} totaal aantal documenten',
    uploadFileToSeePreview: 'Upload een bestand om een voorbeeld te zien',
  },
}

export const nl: PluginLanguage = {
  dateFNSKey: 'nl',
  translations: nlTranslations,
}
