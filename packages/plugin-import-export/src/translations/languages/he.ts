import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const heTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'כל המיקומים',
    exportDocumentLabel: 'ייצוא {{label}}',
    exportOptions: 'אפשרויות ייצוא',
    'field-depth-label': 'עומק',
    'field-drafts-label': 'כלול טיוטות',
    'field-fields-label': 'שדות',
    'field-format-label': 'פורמט יצוא',
    'field-limit-label': 'הגבלה',
    'field-locale-label': 'מקום',
    'field-name-label': 'שם הקובץ',
    'field-page-label': 'עמוד',
    'field-selectionToUse-label': 'בחירה לשימוש',
    'field-sort-label': 'מיין לפי',
    'field-sort-order-label': 'סדר מיון',
    'selectionToUse-allDocuments': 'השתמש בכל המסמכים',
    'selectionToUse-currentFilters': 'השתמש במסננים הנוכחיים',
    'selectionToUse-currentSelection': 'השתמש בבחירה הנוכחית',
    totalDocumentsCount: '{{count}} מסמכים כולל',
  },
}

export const he: PluginLanguage = {
  dateFNSKey: 'he',
  translations: heTranslations,
}
