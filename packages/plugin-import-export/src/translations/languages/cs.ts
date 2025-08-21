import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const csTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Všechny lokalizace',
    exportDocumentLabel: 'Export {{label}}',
    exportOptions: 'Možnosti exportu',
    'field-depth-label': 'Hloubka',
    'field-drafts-label': 'Zahrnout návrhy',
    'field-fields-label': 'Pole',
    'field-format-label': 'Formát exportu',
    'field-limit-label': 'Limita',
    'field-locale-label': 'Místní',
    'field-name-label': 'Název souboru',
    'field-page-label': 'Stránka',
    'field-selectionToUse-label': 'Výběr k použití',
    'field-sort-label': 'Seřadit podle',
    'field-sort-order-label': 'Řazení',
    'selectionToUse-allDocuments': 'Použijte všechny dokumenty',
    'selectionToUse-currentFilters': 'Použijte aktuální filtry',
    'selectionToUse-currentSelection': 'Použijte aktuální výběr',
    totalDocumentsCount: '{{count}} celkem dokumentů',
  },
}

export const cs: PluginLanguage = {
  dateFNSKey: 'cs',
  translations: csTranslations,
}
