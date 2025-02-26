import type { GenericTranslationsObject } from '@payloadcms/translations'

export const sl: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Skoraj končano',
    autoGenerate: 'Samodejno generiranje',
    bestPractices: 'najboljše prakse',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} znakov, ',
    charactersLeftOver: '{{characters}} znakov preveč',
    charactersToGo: '{{characters}} znakov preostalo',
    charactersTooMany: '{{characters}} znakov preveč',
    checksPassing: '{{current}}/{{max}} preverjanj je uspelo',
    good: 'Dobro',
    imageAutoGenerationTip: 'Samodejno generiranje bo preneslo izbrano glavno sliko.',
    lengthTipDescription:
      'To naj bo dolgo med {{minLength}} in {{maxLength}} znakov. Za pomoč pri pisanju kakovostnih meta opisov si oglejte ',
    lengthTipTitle:
      'To naj bo dolgo med {{minLength}} in {{maxLength}} znakov. Za pomoč pri pisanju kakovostnih meta naslovov si oglejte ',
    missing: 'Manjkajoče',
    noImage: 'Brez slike',
    preview: 'Predogled',
    previewDescription:
      'Natančni rezultati iskanja se lahko razlikujejo glede na vsebino in relevantnost iskanja.',
    tooLong: 'Presega dovoljeno dolžino',
    tooShort: 'Prekratka dolžina',
  },
}
