import type { GenericTranslationsObject } from '@payloadcms/translations'

export const uk: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Ще трошки',
    autoGenerate: 'Згенерувати',
    bestPractices: 'найкращі практики',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} символів, ',
    charactersLeftOver: 'залишилось {{characters}} символів',
    charactersToGo: ' на {{characters}} символів коротше',
    charactersTooMany: 'на {{characters}} символів довше',
    checksPassing: '{{current}}/{{max}} перевірок пройдено',
    good: 'Чудово',
    imageAutoGenerationTip: 'Автоматична генерація використає зображення з головного блоку',
    lengthTipDescription:
      'Має бути від {{minLength}} до {{maxLength}} символів. Щоб дізнатися, як писати якісні метаописи — перегляньте ',
    lengthTipTitle:
      'Має бути від {{minLength}} до {{maxLength}} символів. Щоб дізнатися, як писати якісні метазаголовки — перегляньте ',
    missing: 'Відсутнє',
    noImage: 'Немає зображення',
    preview: 'Попередній перегляд',
    previewDescription:
      'Реальне відображення може відрізнятися в залежності від вмісту та релевантності пошуку.',
    tooLong: 'Задовгий',
    tooShort: 'Закороткий',
  },
}
