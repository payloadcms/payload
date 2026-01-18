import type { Language } from '@ruya.sa/translations'

import type { enTranslations } from './languages/en.js'

export type PluginLanguage = Language<{
  'plugin-import-export': {
    documentsToExport: string
    documentsToImport: string
    exportDocumentLabel: string
    exportOptions: string
    'field-collectionSlug-label': string
    'field-depth-label': string
    'field-drafts-label': string
    'field-fields-label': string
    'field-format-label': string
    'field-importMode-create-label': string
    'field-importMode-label': string
    'field-importMode-update-label': string
    'field-importMode-upsert-label': string
    'field-limit-label': string
    'field-locale-label': string
    'field-matchField-description': string
    'field-matchField-label': string
    'field-name-label': string
    'field-page-label': string
    'field-selectionToUse-label': string
    'field-sort-label': string
    'field-sort-order-label': string
    'field-status-label': string
    'field-summary-label': string
    importDocumentLabel: string
    previewPageInfo: string
    'selectionToUse-allDocuments': string
    'selectionToUse-currentFilters': string
    'selectionToUse-currentSelection': string
    totalDocumentsCount: string
  }
}>

export type PluginDefaultTranslationsObject = typeof enTranslations
