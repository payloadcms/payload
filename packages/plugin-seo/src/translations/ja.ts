import type { GenericTranslationsObject } from '@payloadcms/translations'

export const ja: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'もう少しで完了',
    autoGenerate: '自動生成',
    bestPractices: 'ベストプラクティス',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} 文字, ',
    charactersLeftOver: '{{characters}} 文字残り',
    charactersToGo: '{{characters}} 文字入力する必要があります',
    charactersTooMany: '{{characters}} 文字多すぎ',
    checksPassing: '{{current}}/{{max}} のチェックが合格しています',
    good: '良い',
    imageAutoGenerationTip: '自動生成は、選択されたヒーロー画像を取得します。',
    lengthTipDescription:
      'これは {{minLength}} と {{maxLength}} 文字の間である必要があります。質の高いメタディスクリプションを書くためのヘルプについては、こちらを参照してください ',
    lengthTipTitle:
      'これは {{minLength}} と {{maxLength}} 文字の間である必要があります。質の高いメタタイトルを書くためのヘルプについては、こちらを参照してください ',
    missing: '不足',
    noImage: '画像なし',
    preview: 'プレビュー',
    previewDescription:
      '正確な結果は、コンテンツおよび検索の関連性に基づいて異なる場合があります。',
    tooLong: '長すぎる',
    tooShort: '短すぎる',
  },
}
