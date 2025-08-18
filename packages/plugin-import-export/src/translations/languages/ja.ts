import type { PluginDefaultTranslationsObject, PluginLanguage } from '../types.js'

export const jaTranslations: PluginDefaultTranslationsObject = {
  'plugin-import-export': {
    allLocales: 'すべてのロケール',
    exportDocumentLabel: '{{label}}をエクスポートする',
    exportOptions: 'エクスポートオプション',
    'field-depth-label': '深さ',
    'field-drafts-label': 'ドラフトを含めます',
    'field-fields-label': 'フィールド',
    'field-format-label': 'エクスポート形式',
    'field-limit-label': '制限',
    'field-locale-label': 'ロケール',
    'field-name-label': 'ファイル名',
    'field-page-label': 'ページ',
    'field-selectionToUse-label': '使用する選択',
    'field-sort-label': '並び替える',
    'field-sort-order-label': '並び替えの順序',
    'selectionToUse-allDocuments': 'すべての文書を使用してください。',
    'selectionToUse-currentFilters': '現在のフィルターを使用してください',
    'selectionToUse-currentSelection': '現在の選択を使用する',
    totalDocumentsCount: '{{count}}合計の文書',
  },
}

export const ja: PluginLanguage = {
  dateFNSKey: 'ja',
  translations: jaTranslations,
}
