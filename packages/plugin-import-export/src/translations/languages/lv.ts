import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const lvTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Visas lokalitātes',
    exportDocumentLabel: 'Eksportēt {{label}}',
    exportOptions: 'Eksportēšanas opcijas',
    'field-depth-label': 'Dziļums',
    'field-drafts-label': 'Iekļaut melnrakstus',
    'field-fields-label': 'Lauki',
    'field-format-label': 'Eksporta formāts',
    'field-limit-label': 'Limits',
    'field-locale-label': 'Lokalizācija',
    'field-name-label': 'Faila nosaukums',
    'field-page-label': 'Lapa',
    'field-selectionToUse-label': 'Izvēles lietošana',
    'field-sort-label': 'Kārtot pēc',
    'field-sort-order-label': 'Kārtot pēc secības',
    'selectionToUse-allDocuments': 'Izmantojiet visus dokumentus',
    'selectionToUse-currentFilters': 'Izmantot pašreizējos filtrus',
    'selectionToUse-currentSelection': 'Izmantot pašreizējo izvēli',
    totalDocumentsCount: '{{count}} kopā dokumenti',
  },
}

export const lv: PluginLanguage = {
  dateFNSKey: 'lv',
  translations: lvTranslations,
}
