import type { GenericTranslationsObject } from '@payloadcms/translations'

export const bg: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Почти стигнахме',
    autoGenerate: 'Автоматично генериране',
    bestPractices: 'най-добри практики',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} знака, ',
    charactersLeftOver: '{{characters}} оставащи',
    charactersToGo: '{{characters}} за въвеждане',
    charactersTooMany: '{{characters}} твърде много',
    checksPassing: '{{current}}/{{max}} проверки преминали успешно',
    good: 'Добре',
    imageAutoGenerationTip: 'Автоматичното генериране ще извлече избраното основно изображение.',
    lengthTipDescription:
      'Това трябва да бъде между {{minLength}} и {{maxLength}} знака. За помощ при писането на качествени мета описания, вижте ',
    lengthTipTitle:
      'Това трябва да бъде между {{minLength}} и {{maxLength}} знака. За помощ при писането на качествени мета заглавия, вижте ',
    missing: 'Липсва',
    noImage: 'Няма изображение',
    preview: 'Предварителен преглед',
    previewDescription:
      'Точните резултати може да варират в зависимост от съдържанието и релевантността на търсенето.',
    tooLong: 'Твърде дълго',
    tooShort: 'Твърде късо',
  },
}
