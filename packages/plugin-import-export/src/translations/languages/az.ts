import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const azTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Bütün yerlər',
    exportDocumentLabel: '{{label}} ixrac edin',
    exportOptions: 'İxrac Variantları',
    'field-depth-label': 'Dərinlik',
    'field-drafts-label': 'Qaralamaları daxil etin',
    'field-fields-label': 'Sahələr',
    'field-format-label': 'İxrac Formatı',
    'field-limit-label': 'Hədd',
    'field-locale-label': 'Yerli',
    'field-name-label': 'Fayl adı',
    'field-page-label': 'Səhifə',
    'field-selectionToUse-label': 'İstifadə etmək üçün seçim',
    'field-sort-label': 'Sırala',
    'field-sort-order-label': 'Sıralama',
    'selectionToUse-allDocuments': 'Bütün sənədlərdən istifadə edin',
    'selectionToUse-currentFilters': 'Cari filtrlərdən istifadə edin',
    'selectionToUse-currentSelection': 'Cari seçimi istifadə edin',
    totalDocumentsCount: '{{count}} ümumi sənəd',
  },
}

export const az: PluginLanguage = {
  dateFNSKey: 'az',
  translations: azTranslations,
}
