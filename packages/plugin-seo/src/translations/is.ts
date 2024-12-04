import type { GenericTranslationsObject } from '@payloadcms/translations'

export const is: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Nánast komið',
    autoGenerate: 'Stofna sjálfkrafa',
    bestPractices: 'bestu venjur',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} stafir, ',
    charactersLeftOver: '{{characters}} eftir',
    charactersToGo: '{{characters}} stafir þangað til',
    charactersTooMany: '{{characters}} stafir of margir',
    checksPassing: '{{current}}/{{max}} yfirferðir standast',
    good: 'Flott',
    imageAutoGenerationTip: 'Mynd verður sjálfkrafa sótt sem hetjumynd',
    lengthTipDescription:
      'Stafalengd skal vera á milli {{minLength}} og {{maxLength}} stafir. Fyrir hjálp við að skrifa gæða meta lýsingar, sjá nánar hér ',
    lengthTipTitle:
      'Stafalengd skal vera á milli {{minLength}} og {{maxLength}} stafir. Fyrir hjálp við að skrifa gæða meta lýsingar, sjá nánar hér ',
    missing: 'Það vantar',
    noImage: 'Engin mynd',
    preview: 'Forskoða',
    previewDescription:
      'Nákvæmar niðurstöður geta verið mismunandi eftir samspili efnis og leitarskilyrða.',
    tooLong: 'Of langt',
    tooShort: 'Of stutt',
  },
}
