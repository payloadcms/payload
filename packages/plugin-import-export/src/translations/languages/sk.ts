import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const skTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Všetky miestne nastavenia',
    exportDocumentLabel: 'Export {{label}}',
    exportOptions: 'Možnosti exportu',
    'field-depth-label': 'Hĺbka',
    'field-drafts-label': 'Zahrnúť návrhy',
    'field-fields-label': 'Polia',
    'field-format-label': 'Formát exportu',
    'field-limit-label': 'Limit',
    'field-locale-label': 'Lokalita',
    'field-name-label': 'Názov súboru',
    'field-page-label': 'Stránka',
    'field-selectionToUse-label': 'Výber na použitie',
    'field-sort-label': 'Triediť podľa',
    'field-sort-order-label': 'Poradie triedenia',
    'selectionToUse-allDocuments': 'Použite všetky dokumenty',
    'selectionToUse-currentFilters': 'Použiť aktuálne filtre',
    'selectionToUse-currentSelection': 'Použiť aktuálny výber',
    totalDocumentsCount: '{{count}} celkový počet dokumentov',
  },
}

export const sk: PluginLanguage = {
  dateFNSKey: 'sk',
  translations: skTranslations,
}
