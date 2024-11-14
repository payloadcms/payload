import type { GenericTranslationsObject } from '@payloadcms/translations'

export const nb: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Nesten der',
    autoGenerate: 'Auto-generer',
    bestPractices: 'beste praksis',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} tegn, ',
    charactersLeftOver: '{{characters}} til overs',
    charactersToGo: '{{characters}} igjen',
    charactersTooMany: '{{characters}} for mange',
    checksPassing: '{{current}}/{{max}} sjekker bestått',
    good: 'Bra',
    imageAutoGenerationTip: 'Auto-generering vil hente det valgte hero-bildet.',
    lengthTipDescription:
      'Dette bør være mellom {{minLength}} og {{maxLength}} tegn. For hjelp til å skrive beskrivelser av god kvalitet, se ',
    lengthTipTitle:
      'Dette bør være mellom {{minLength}} og {{maxLength}} tegn. For hjelp til å skrive metatitler av god kvalitet, se ',
    missing: 'Mangler',
    noImage: 'Bilde mangler',
    preview: 'Forhåndsvisning',
    previewDescription:
      'Eksakte resultatoppføringer kan variere basert på innhold og søke relevans.',
    tooLong: 'For lang',
    tooShort: 'For kort',
  },
}
