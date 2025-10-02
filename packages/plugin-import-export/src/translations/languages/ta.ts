import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const taTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'அனைத்து மொழிகள்',
    exportDocumentLabel: '{{label}} ஏற்றுமதி',
    exportOptions: 'ஏற்றுமதி விருப்பங்கள்',
    'field-depth-label': 'ஆழம்',
    'field-drafts-label': 'வரைவுகளைச் சேர்க்கவும்',
    'field-fields-label': 'புலங்கள்',
    'field-format-label': 'ஏற்றுமதி வடிவம்',
    'field-limit-label': 'வரம்பு',
    'field-locale-label': 'மொழி',
    'field-name-label': 'கோப்பு பெயர்',
    'field-page-label': 'பக்கம்',
    'field-selectionToUse-label': 'பயன்படுத்தத் தேர்வு',
    'field-sort-label': 'இதன்படி வரிசைப்படுத்து',
    'field-sort-order-label': 'வரிசைப்படுத்தும் ஒழுங்கு',
    'selectionToUse-allDocuments': 'அனைத்து ஆவணங்களையும் பயன்படுத்தவும்',
    'selectionToUse-currentFilters': 'தற்போதைய வடிப்பான்களை பயன்படுத்தவும்',
    'selectionToUse-currentSelection': 'தற்போதைய தேர்வைப் பயன்படுத்தவும்',
    totalDocumentsCount: 'மொத்தம் {{count}} ஆவணங்கள்',
  },
}

export const ta: PluginLanguage = {
  dateFNSKey: 'ta',
  translations: taTranslations,
}
