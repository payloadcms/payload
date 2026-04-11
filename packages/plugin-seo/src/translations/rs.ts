import type { GenericTranslationsObject } from '@payloadcms/translations'

export const rs: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Скоро готово',
    autoGenerate: 'Аутоматски генериши',
    bestPractices: 'најбоље праксе',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} карактера, ',
    charactersLeftOver: '{{characters}} карактера вишка',
    charactersToGo: '{{characters}} карактера преостало',
    charactersTooMany: '{{characters}} карактера превише',
    checksPassing: '{{current}}/{{max}} провера успешно прошло',
    good: 'Добро',
    imageAutoGenerationTip: 'Аутоматско генерисање ће преузети изабрану херо слику.',
    lengthTipDescription:
      'Ово треба да има између {{minLength}} и {{maxLength}} карактера. За помоћ у писању квалитетних мета описа, погледајте ',
    lengthTipTitle:
      'Ово треба да има између {{minLength}} и {{maxLength}} карактера. За помоћ у писању квалитетних мета наслова, погледајте ',
    missing: 'Недостаје',
    noImage: 'Нема слике',
    preview: 'Преглед',
    previewDescription:
      'Тачни резултати претраге могу варирати у зависности од садржаја и релевантности претраге.',
    tooLong: 'Предугачко',
    tooShort: 'Прекратко',
  },
}
