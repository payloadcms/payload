import type { GenericTranslationsObject } from '@payloadcms/translations'

export const et: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Peaaegu kohal',
    autoGenerate: 'Automaatne genereerimine',
    bestPractices: 'parimad tavad',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} tähemärki, ',
    charactersLeftOver: '{{characters}} alles',
    charactersToGo: '{{characters}} kirjutada',
    charactersTooMany: '{{characters}} liiga palju',
    checksPassing: '{{current}}/{{max}} kontrolli on läbitud',
    good: 'Hea',
    imageAutoGenerationTip: 'Automaatne genereerimine toob valitud kangelaspildi.',
    lengthTipDescription:
      'See peaks olema vahemikus {{minLength}} ja {{maxLength}} tähemärki. Kvaliteetsete meta-kirjelduste kirjutamiseks vaata ',
    lengthTipTitle:
      'See peaks olema vahemikus {{minLength}} ja {{maxLength}} tähemärki. Kvaliteetsete meta-pealkirjade kirjutamiseks vaata ',
    missing: 'Puudub',
    noImage: 'Pilt puudub',
    preview: 'Eelvaade',
    previewDescription:
      'Täpsed tulemused võivad varieeruda sõltuvalt sisust ja otsingu asjakohasusest.',
    tooLong: 'Liiga pikk',
    tooShort: 'Liiga lühike',
  },
}
