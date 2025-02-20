import type { GenericTranslationsObject } from '@payloadcms/translations'

export const lt: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Beveik baigta',
    autoGenerate: 'Automatinis generavimas',
    bestPractices: 'geriausios praktikos',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} simbolių, ',
    charactersLeftOver: '{{characters}} likusių simbolių',
    charactersToGo: '{{characters}} simbolių liko',
    charactersTooMany: '{{characters}} per daug simbolių',
    checksPassing: '{{current}}/{{max}} tikrinimų sėkmingi',
    good: 'Gerai',
    imageAutoGenerationTip: 'Automatinis generavimas paims pasirinktą pagrindinį vaizdą.',
    lengthTipDescription:
      'Šis tekstas turi būti tarp {{minLength}} ir {{maxLength}} simbolių. Norėdami gauti pagalbos rašant kokybiškus meta aprašus, žiūrėkite ',
    lengthTipTitle:
      'Šis tekstas turi būti tarp {{minLength}} ir {{maxLength}} simbolių. Norėdami gauti pagalbos rašant kokybiškus meta pavadinimus, žiūrėkite ',
    missing: 'Trūksta',
    noImage: 'Nėra vaizdo',
    preview: 'Peržiūra',
    previewDescription:
      'Tikrųjų paieškos rezultatų gali skirtis priklausomai nuo turinio ir paieškos svarbos.',
    tooLong: 'Per ilgas',
    tooShort: 'Per trumpas',
  },
}
