import type { GenericTranslationsObject } from '@payloadcms/translations'

export const ru: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Почти готово',
    autoGenerate: 'Сгенерировать автоматически',
    bestPractices: 'лучшие практики',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} символов, ',
    charactersLeftOver: 'осталось {{characters}} символов',
    charactersToGo: 'на {{characters}} символов меньше',
    charactersTooMany: 'на {{characters}} символов больше',
    checksPassing: '{{current}}/{{max}} проверок пройдено',
    good: 'Хорошо',
    imageAutoGenerationTip: 'Автогенерация использует выбранное главное изображение.',
    lengthTipDescription:
      'Должно быть от {{minLength}} до {{maxLength}} символов. Для помощи в написании качественных метаописаний см.',
    lengthTipTitle:
      'Должно быть от {{minLength}} до {{maxLength}} символов. Для помощи в написании качественных метазаголовков см.',
    missing: 'Отсутствует',
    noImage: 'Нет изображения',
    preview: 'Предварительный просмотр',
    previewDescription:
      'Фактические результаты могут отличаться в зависимости от контента и релевантности поиска.',
    tooLong: 'Слишком длинно',
    tooShort: 'Слишком коротко',
  },
}
