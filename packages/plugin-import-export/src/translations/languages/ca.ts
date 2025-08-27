import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const caTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Totes les localitzacions',
    exportDocumentLabel: 'Exporta {{label}}',
    exportOptions: "Opcions d'exportació",
    'field-depth-label': 'Profunditat',
    'field-drafts-label': 'Inclou esborranys',
    'field-fields-label': 'Camps',
    'field-format-label': "Format d'exportació",
    'field-limit-label': 'Límit',
    'field-locale-label': 'Local',
    'field-name-label': 'Nom del fitxer',
    'field-page-label': 'Pàgina',
    'field-selectionToUse-label': 'Selecció per utilitzar',
    'field-sort-label': 'Ordena per',
    'field-sort-order-label': 'Ordre de classificació',
    'selectionToUse-allDocuments': 'Utilitzeu tots els documents',
    'selectionToUse-currentFilters': 'Utilitza els filtres actuals',
    'selectionToUse-currentSelection': 'Utilitza la selecció actual',
    totalDocumentsCount: '{{count}} documents totals',
  },
}

export const ca: PluginLanguage = {
  dateFNSKey: 'ca',
  translations: caTranslations,
}
