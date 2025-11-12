import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const frTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Tous les paramètres régionaux',
    exportDocumentLabel: 'Exporter {{label}}',
    exportOptions: "Options d'exportation",
    'field-depth-label': 'Profondeur',
    'field-drafts-label': 'Inclure les ébauches',
    'field-fields-label': 'Champs',
    'field-format-label': "Format d'exportation",
    'field-limit-label': 'Limite',
    'field-locale-label': 'Localisation',
    'field-name-label': 'Nom de fichier',
    'field-page-label': 'Page',
    'field-selectionToUse-label': 'Sélection à utiliser',
    'field-sort-label': 'Trier par',
    'field-sort-order-label': 'Ordre de tri',
    'selectionToUse-allDocuments': 'Utilisez tous les documents',
    'selectionToUse-currentFilters': 'Utilisez les filtres actuels',
    'selectionToUse-currentSelection': 'Utilisez la sélection actuelle',
    totalDocumentsCount: '{{count}} documents au total',
  },
}

export const fr: PluginLanguage = {
  dateFNSKey: 'fr',
  translations: frTranslations,
}
