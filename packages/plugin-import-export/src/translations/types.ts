import type { Language } from '@payloadcms/translations'

import type { enTranslations } from './languages/en.js'

export type PluginLanguage = Language<{
  'plugin-import-export': {
    exportDocumentLabel: string
    exportOptions: string
    'field-depth-label': string
    'field-drafts-label': string
    'field-fields-label': string
    'field-format-label': string
    'field-limit-label': string
    'field-locale-label': string
    'field-name-label': string
    'field-page-label': string
    'field-selectionToUse-label': string
    'field-sort-label': string
    'field-sort-order-label': string
    'selectionToUse-allDocuments': string
    'selectionToUse-currentFilters': string
    'selectionToUse-currentSelection': string
    totalDocumentsCount: string
  }
}>

export type PluginDefaultTranslationsObject = typeof enTranslations
