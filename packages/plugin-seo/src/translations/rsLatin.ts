import type { GenericTranslationsObject } from '@payloadcms/translations'

export const rsLatin: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Skoro gotovo',
    autoGenerate: 'Automatski generiši',
    bestPractices: 'najbolje prakse',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} karaktera, ',
    charactersLeftOver: '{{characters}} karaktera viška',
    charactersToGo: '{{characters}} karaktera preostalo',
    charactersTooMany: '{{characters}} karaktera previše',
    checksPassing: '{{current}}/{{max}} provera uspešno prošlo',
    good: 'Dobro',
    imageAutoGenerationTip: 'Automatsko generisanje će preuzeti izabranu hero sliku.',
    lengthTipDescription:
      'Ovo treba da ima između {{minLength}} i {{maxLength}} karaktera. Za pomoć u pisanju kvalitetnih meta opisa, pogledajte ',
    lengthTipTitle:
      'Ovo treba da ima između {{minLength}} i {{maxLength}} karaktera. Za pomoć u pisanju kvalitetnih meta naslova, pogledajte ',
    missing: 'Nedostaje',
    noImage: 'Nema slike',
    preview: 'Pregled',
    previewDescription:
      'Tačni rezultati pretrage mogu varirati u zavisnosti od sadržaja i relevantnosti pretrage.',
    tooLong: 'Predugačko',
    tooShort: 'Prekratko',
  },
}
