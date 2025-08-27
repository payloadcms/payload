import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const myTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'အားလုံးနေရာတွင်',
    exportDocumentLabel: 'Eksport {{label}}',
    exportOptions: 'Pilihan Eksport',
    'field-depth-label': 'အန္တိုင်း',
    'field-drafts-label': 'မူကြမ်းများပါဝင်ပါ',
    'field-fields-label': 'ကွင်းပျိုးရန်ကွက်များ',
    'field-format-label': 'တင်ပို့နည်းအစီအစဉ်',
    'field-limit-label': 'ကန့်သတ်ချက်',
    'field-locale-label': 'Tempatan',
    'field-name-label': 'ဖိုင်နာမည်',
    'field-page-label': 'စာမျက်နှာ',
    'field-selectionToUse-label': 'Pilihan untuk digunakan',
    'field-sort-label': 'စီမံအလိုက်',
    'field-sort-order-label': 'Sorteringsrækkefølge',
    'selectionToUse-allDocuments': 'Gunakan semua dokumen',
    'selectionToUse-currentFilters': 'Gunakan penapis semasa',
    'selectionToUse-currentSelection': 'Gunakan pilihan semasa',
    totalDocumentsCount: '{{count}} keseluruhan dokumen',
  },
}

export const my: PluginLanguage = {
  dateFNSKey: 'en-US',
  translations: myTranslations,
}
