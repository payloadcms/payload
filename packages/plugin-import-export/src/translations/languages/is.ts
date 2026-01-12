import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const isTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Allar staðfærslur',
    exportDocumentLabel: 'Flytja út {{label}}',
    exportOptions: 'Útflutningsvalkostir',
    'field-depth-label': 'Dýpt',
    'field-drafts-label': 'Innihalda drög',
    'field-fields-label': 'Reitir',
    'field-format-label': 'Útflutnings snið',
    'field-limit-label': 'Takmörkun',
    'field-locale-label': 'Staðfærsla',
    'field-name-label': 'Skrár nafn',
    'field-page-label': 'Síða',
    'field-selectionToUse-label': 'Val til að nota',
    'field-sort-label': 'Raða eftir',
    'field-sort-order-label': 'Röðun',
    'selectionToUse-allDocuments': 'Nota allar færslur',
    'selectionToUse-currentFilters': 'Nota núverandi síu',
    'selectionToUse-currentSelection': 'Nota núverandi val',
    totalDocumentsCount: '{{count}} færslur',
  },
}

export const is: PluginLanguage = {
  dateFNSKey: 'is',
  translations: isTranslations,
}
