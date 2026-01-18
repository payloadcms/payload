import type { GenericTranslationsObject } from '@payloadcms/translations'

export const is: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Næstum komið',
    autoGenerate: 'Mynda sjálfkrafa',
    bestPractices: 'bestu venjur',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} stafir, ',
    charactersLeftOver: '{{characters}} eftir',
    charactersToGo: '{{characters}} eftir',
    charactersTooMany: '{{characters}} of mikið',
    checksPassing: '{{current}}/{{max}} athuganir standast',
    good: 'Gott',
    imageAutoGenerationTip: 'Sjálfvirk myndun mun sækja valda hetjumynd.',
    lengthTipDescription:
      'Þetta ætti að vera á milli {{minLength}} og {{maxLength}} stafir. Fyrir hjálp með að skrifa góða lýsingu, sjáðu ',
    lengthTipTitle:
      'Þetta ætti að vera á milli {{minLength}} og {{maxLength}} stafir. Fyrir hjálp með að skrifa góðan titil, sjáðu ',
    missing: 'Vantar',
    noImage: 'Engin mynd',
    preview: 'Forskoðun',
    previewDescription:
      'Nákvæmar niðurstöður geta verið mismunandi eftir efni og viðeigandi leitar.',
    tooLong: 'Of langt',
    tooShort: 'Of stutt',
  },
}
