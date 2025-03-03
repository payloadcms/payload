import type { GenericTranslationsObject } from '@payloadcms/translations'

export const hu: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Majdnem kész',
    autoGenerate: 'Automatikus generálás',
    bestPractices: 'legjobb gyakorlatok',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} karakter, ',
    charactersLeftOver: '{{characters}} hátra van',
    charactersToGo: '{{characters}} hátra van a beíráshoz',
    charactersTooMany: '{{characters}} túl sok',
    checksPassing: '{{current}}/{{max}} ellenőrzés sikeres',
    good: 'Jó',
    imageAutoGenerationTip: 'Az automatikus generálás a kiválasztott hős képet fogja lekérni.',
    lengthTipDescription:
      'Ez legyen {{minLength}} és {{maxLength}} karakter között. Segítség a minőségi meta leírások írásához, nézd meg ',
    lengthTipTitle:
      'Ez legyen {{minLength}} és {{maxLength}} karakter között. Segítség a minőségi meta címek írásához, nézd meg ',
    missing: 'Hiányzik',
    noImage: 'Nincs kép',
    preview: 'Előnézet',
    previewDescription:
      'A pontos eredmények változhatnak a tartalom és a keresési relevancia alapján.',
    tooLong: 'Túl hosszú',
    tooShort: 'Túl rövid',
  },
}
