import type { GenericTranslationsObject } from '@payloadcms/translations'

export const nl: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Bijna klaar',
    autoGenerate: 'Automatisch genereren',
    bestPractices: 'best practices',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} tekens, ',
    charactersLeftOver: '{{characters}} tekens over',
    charactersToGo: '{{characters}} tekens te gaan',
    charactersTooMany: '{{characters}} tekens te veel',
    checksPassing: '{{current}}/{{max}} controles geslaagd',
    good: 'Goed',
    imageAutoGenerationTip: 'Automatische generatie haalt de geselecteerde hero-afbeelding op.',
    lengthTipDescription:
      'Dit moet tussen {{minLength}} en {{maxLength}} tekens lang zijn. Voor hulp bij het schrijven van kwalitatieve metabeschrijvingen, zie ',
    lengthTipTitle:
      'Dit moet tussen {{minLength}} en {{maxLength}} tekens lang zijn. Voor hulp bij het schrijven van kwalitatieve metatitels, zie ',
    missing: 'Ontbreekt',
    noImage: 'Geen afbeelding',
    preview: 'Voorbeeld',
    previewDescription:
      'Exacte zoekresultaten kunnen variëren op basis van inhoud en zoekrelevantie.',
    tooLong: 'Te lang',
    tooShort: 'Te kort',
  },
}
