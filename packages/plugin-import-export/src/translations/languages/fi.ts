import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const fiTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Kaikki kielet',
    exportDocumentLabel: 'Vie {{label}}',
    exportOptions: 'Vientiasetukset',
    'field-depth-label': 'Syvyys',
    'field-drafts-label': 'Sisällytä luonnokset',
    'field-fields-label': 'Kentät',
    'field-format-label': 'Vientiformaatti',
    'field-limit-label': 'Maksimimäärä',
    'field-locale-label': 'Kieli',
    'field-name-label': 'Tiedostonimi',
    'field-page-label': 'Sivu',
    'field-selectionToUse-label': 'Käytettävä valinta',
    'field-sort-label': 'Järjestä',
    'field-sort-order-label': 'Järjestyssuunta',
    'selectionToUse-allDocuments': 'Käytä kaikkia dokumentteja',
    'selectionToUse-currentFilters': 'Käytä nykyisiä suodattimia',
    'selectionToUse-currentSelection': 'Käytä nykyistä valintaa',
    totalDocumentsCount: '{{count}} dokumenttia yhteensä',
  },
}

export const fi: PluginLanguage = {
  dateFNSKey: 'fi',
  translations: fiTranslations,
}
