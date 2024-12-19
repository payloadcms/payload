import type { GenericTranslationsObject } from '@payloadcms/translations'

export const nl: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Bijna daar',
    autoGenerate: 'Automatisch genereren',
    bestPractices: 'best practices',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} tekens, ',
    charactersLeftOver: '{{characters}} over',
    charactersToGo: '{{characters}} te gaan',
    charactersTooMany: '{{characters}} te veel',
    checksPassing: '{{current}}/{{max}} controles geslaagd',
    good: 'Goed',
    imageAutoGenerationTip: 'Automatisch genereren haalt de geselecteerde hero-afbeelding op.',
    lengthTipDescription:
      'Dit moet tussen {{minLength}} en {{maxLength}} tekens zijn. Voor hulp bij het schrijven van kwalitatieve meta-omschrijvingen, zie ',
    lengthTipTitle:
      'Dit moet tussen {{minLength}} en {{maxLength}} tekens zijn. Voor hulp bij het schrijven van kwalitatieve metatitels, zie ',
    missing: 'Ontbreekt',
    noImage: 'Geen afbeelding',
    preview: 'Voorbeeld',
    previewDescription: 'Exacte resultaten kunnen variëren op basis van inhoud en zoekrelevantie.',
    tooLong: 'Te lang',
    tooShort: 'Te kort',
  },
}
