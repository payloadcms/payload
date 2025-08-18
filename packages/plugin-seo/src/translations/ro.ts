import type { GenericTranslationsObject } from '@payloadcms/translations'

export const ro: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Aproape gata',
    autoGenerate: 'Generare automată',
    bestPractices: 'bune practici',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} caractere, ',
    charactersLeftOver: '{{characters}} caractere în plus',
    charactersToGo: '{{characters}} caractere rămase',
    charactersTooMany: '{{characters}} caractere prea multe',
    checksPassing: '{{current}}/{{max}} verificări trecute',
    good: 'Bun',
    imageAutoGenerationTip: 'Generarea automată va prelua imaginea reprezentativă selectată.',
    lengthTipDescription:
      'Aceasta ar trebui să aibă între {{minLength}} și {{maxLength}} caractere. Pentru ajutor în redactarea descrierilor meta de calitate, vezi ',
    lengthTipTitle:
      'Aceasta ar trebui să aibă între {{minLength}} și {{maxLength}} caractere. Pentru ajutor în redactarea titlurilor meta de calitate, vezi ',
    missing: 'Lipsește',
    noImage: 'Nicio imagine',
    preview: 'Previzualizare',
    previewDescription:
      'Rezultatele exacte pot varia în funcție de conținut și relevanța căutării.',
    tooLong: 'Prea lung',
    tooShort: 'Prea scurt',
  },
}
