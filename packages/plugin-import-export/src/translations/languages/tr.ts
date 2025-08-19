import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const trTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Tüm yerler',
    exportDocumentLabel: '{{label}} dışa aktar',
    exportOptions: 'İhracat Seçenekleri',
    'field-depth-label': 'Derinlik',
    'field-drafts-label': 'Taslakları dahil et',
    'field-fields-label': 'Alanlar',
    'field-format-label': 'İhracat Formatı',
    'field-limit-label': 'Sınır',
    'field-locale-label': 'Yerel',
    'field-name-label': 'Dosya adı',
    'field-page-label': 'Sayfa',
    'field-selectionToUse-label': 'Kullanılacak seçim',
    'field-sort-label': 'Sırala',
    'field-sort-order-label': 'Sıralama düzeni',
    'selectionToUse-allDocuments': 'Tüm belgeleri kullanın',
    'selectionToUse-currentFilters': 'Mevcut filtreleri kullanın',
    'selectionToUse-currentSelection': 'Mevcut seçimi kullanın',
    totalDocumentsCount: '{{count}} toplam belge',
  },
}

export const tr: PluginLanguage = {
  dateFNSKey: 'tr',
  translations: trTranslations,
}
