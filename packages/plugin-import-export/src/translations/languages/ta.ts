import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const taTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'அனைத்து மொழிகள்',
    collectionRequired: 'முன்னோட்டத்தைக் காட்ட வேண்டிய தொகுப்பு',
    exportDocumentLabel: '{{label}} ஏற்றுமதி',
    exportOptions: 'ஏற்றுமதி விருப்பங்கள்',
    'field-collectionSlug-label': undefined,
    'field-depth-label': 'ஆழம்',
    'field-drafts-label': 'வரைவுகளைச் சேர்க்கவும்',
    'field-fields-label': 'புலங்கள்',
    'field-format-label': 'ஏற்றுமதி வடிவம்',
    'field-importMode-create-label': 'புதிய ஆவணங்களை உருவாக்கு',
    'field-importMode-label': undefined,
    'field-importMode-update-label': 'ஏற்கனவே உள்ள ஆவணங்களை புதுப்பிக்கவும்',
    'field-importMode-upsert-label': undefined,
    'field-limit-label': 'வரம்பு',
    'field-locale-label': 'மொழி',
    'field-matchField-description':
      'ஏற்கனவே உள்ள ஆவணங்களை பொருத்தமாக பயன்படுத்த எந்த துறையை பயன்படுத்த வேண்டும்',
    'field-matchField-label': 'பொருந்தும் துறை',
    'field-name-label': 'கோப்பு பெயர்',
    'field-page-label': 'பக்கம்',
    'field-selectionToUse-label': 'பயன்படுத்தத் தேர்வு',
    'field-sort-label': 'இதன்படி வரிசைப்படுத்து',
    'field-sort-order-label': 'வரிசைப்படுத்தும் ஒழுங்கு',
    'field-status-label': 'நிலை',
    'field-summary-label': undefined,
    importDocumentLabel: undefined,
    importResults: undefined,
    matchBy: undefined,
    mode: undefined,
    noDataToPreview: undefined,
    'selectionToUse-allDocuments': 'அனைத்து ஆவணங்களையும் பயன்படுத்தவும்',
    'selectionToUse-currentFilters': 'தற்போதைய வடிப்பான்களை பயன்படுத்தவும்',
    'selectionToUse-currentSelection': 'தற்போதைய தேர்வைப் பயன்படுத்தவும்',
    startImport: undefined,
    totalDocumentsCount: 'மொத்தம் {{count}} ஆவணங்கள்',
    uploadFileToSeePreview: 'ஒரு கோப்பை முன்னோட்டத்தைப் பார்க்க பதிவேற்றுங்கள்',
  },
}

export const ta: PluginLanguage = {
  dateFNSKey: 'ta',
  translations: taTranslations,
}
