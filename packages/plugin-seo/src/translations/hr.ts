import type { GenericTranslationsObject } from '@payloadcms/translations'

export const hr: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Gotovi smo skoro',
    autoGenerate: 'Automatsko generiranje',
    bestPractices: 'najbolje prakse',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} znakova, ',
    charactersLeftOver: '{{characters}} preostalo',
    charactersToGo: '{{characters}} preostalo za unijeti',
    charactersTooMany: '{{characters}} previše',
    checksPassing: '{{current}}/{{max}} provjera prošlo',
    good: 'Dobro',
    imageAutoGenerationTip: 'Automatsko generiranje će preuzeti odabranu sliku heroja.',
    lengthTipDescription:
      'Ovo bi trebalo biti između {{minLength}} i {{maxLength}} znakova. Za pomoć u pisanju kvalitetnih meta opisa, pogledajte ',
    lengthTipTitle:
      'Ovo bi trebalo biti između {{minLength}} i {{maxLength}} znakova. Za pomoć u pisanju kvalitetnih meta naslova, pogledajte ',
    missing: 'Nedostaje',
    noImage: 'Nema slike',
    preview: 'Pregled',
    previewDescription: 'Točni rezultati mogu varirati ovisno o sadržaju i relevantnosti pretrage.',
    tooLong: 'Predugačko',
    tooShort: 'Prekratko',
  },
}
