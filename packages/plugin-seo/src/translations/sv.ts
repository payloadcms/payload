import type { GenericTranslationsObject } from '@payloadcms/translations'

export const sv: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Nästan klar',
    autoGenerate: 'Skapa automatiskt',
    bestPractices: 'bästa praxis',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} tecken, ',
    charactersLeftOver: '{{characters}} tecken blir över',
    charactersToGo: '{{characters}} tecken kvar',
    charactersTooMany: '{{characters}} tecken för mycket',
    checksPassing: '{{current}}/{{max}} kontroller är godkända',
    good: 'Bra',
    imageAutoGenerationTip: 'Den automatiska processen kommer att välja en hero-bild.',
    lengthTipDescription:
      'Bör vara mellan {{minLength}} och {{maxLength}} tecken. För hjälp med att skriva bra metabeskrivningar, se ',
    lengthTipTitle:
      'Bör vara mellan {{minLength}} och {{maxLength}} tecken. För hjälp med att skriva bra metatitlar, se ',
    missing: 'Saknas',
    noImage: 'Ingen bild',
    preview: 'Förhandsgranska',
    previewDescription:
      'Exakta resultatlistningar kan variera baserat på innehåll och sökrelevans.',
    tooLong: 'För lång',
    tooShort: 'För kort',
  },
}
