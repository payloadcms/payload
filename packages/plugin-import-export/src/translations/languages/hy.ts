import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const hyTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'Բոլոր տեղականությունները',
    exportDocumentLabel: 'Փոխարտադրել {{label}}',
    exportOptions: 'Արտահանման տարբերակներ',
    'field-depth-label': 'Խորություն',
    'field-drafts-label': 'Ներառեք սևագրեր',
    'field-fields-label': 'Դաշտեր',
    'field-format-label': 'Արտահանման ձևաչափ',
    'field-limit-label': 'Սահմանափակում',
    'field-locale-label': 'Լոկալ',
    'field-name-label': 'Ֆայլի անվանումը',
    'field-page-label': 'Էջ',
    'field-selectionToUse-label': 'Օգտագործման ընտրություն',
    'field-sort-label': 'Դասավորել ըստ',
    'field-sort-order-label': 'Դասավորության կարգ',
    'selectionToUse-allDocuments': 'Օգտագործեք բոլոր փաստաթղթերը',
    'selectionToUse-currentFilters': 'Օգտագործեք ընթացիկ ֆիլտրերը',
    'selectionToUse-currentSelection': 'Օգտագործել ընթացիկ ընտրությունը',
    totalDocumentsCount: '{{count}} ընդհանուր փաստաթուղթեր',
  },
}

export const hy: PluginLanguage = {
  dateFNSKey: 'hy-AM',
  translations: hyTranslations,
}
