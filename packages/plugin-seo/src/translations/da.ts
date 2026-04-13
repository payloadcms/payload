import type { GenericTranslationsObject } from '@payloadcms/translations'

export const da: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Næsten der',
    autoGenerate: 'Automatisk generering',
    bestPractices: 'bedste praksis',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} tegn, ',
    charactersLeftOver: '{{characters}} tilbage',
    charactersToGo: '{{characters}} tilbage at skrive',
    charactersTooMany: '{{characters}} for mange',
    checksPassing: '{{current}}/{{max}} kontroller er bestået',
    good: 'God',
    imageAutoGenerationTip: 'Automatisk generering vil hente det valgte hero-billede.',
    lengthTipDescription:
      'Dette bør være mellem {{minLength}} og {{maxLength}} tegn. For hjælp til at skrive kvalitetsmeta-beskrivelser, se ',
    lengthTipTitle:
      'Dette bør være mellem {{minLength}} og {{maxLength}} tegn. For hjælp til at skrive kvalitetsmeta-titler, se ',
    missing: 'Manglende',
    noImage: 'Ingen billede',
    preview: 'Forhåndsvisning',
    previewDescription: 'De præcise resultater kan variere afhængigt af indhold og søge relevans.',
    tooLong: 'For lang',
    tooShort: 'For kort',
  },
}
