import type { Language } from '@payloadcms/translations'

import type { en } from './languages/en.js'

export type PluginLanguage = Language<{
  'plugin-import-export': {
    allLocales: string
    download: string
    export: string
    exportDocumentLabel: string
    exportOptions: string
    'field-depth-label': string
    'field-drafts-label': string
    'field-fields-label': string
    'field-format-label': string
    'field-limit-label': string
    'field-locale-label': string
    'field-name-label': string
    'field-selectionToUse-label': string
    'field-sort-label': string
    import: string
    no: string
    preview: string
    'selectionToUse-allDocuments': string
    'selectionToUse-currentFilters': string
    'selectionToUse-currentSelection': string
    totalDocumentsCount: string
    yes: string
  }
}>

export type PluginDefaultTranslationsObject = typeof en
