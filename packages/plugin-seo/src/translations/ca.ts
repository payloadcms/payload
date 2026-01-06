import type { GenericTranslationsObject } from '@payloadcms/translations'

export const ca: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Quasi hi som',
    autoGenerate: 'Generar automàticament',
    bestPractices: 'bones pràctiques',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} caràcters, ',
    charactersLeftOver: '{{characters}} restants',
    charactersToGo: '{{characters}} per escriure',
    charactersTooMany: '{{characters}} massa',
    checksPassing: '{{current}}/{{max}} comprovacions aprovades',
    good: 'Bé',
    imageAutoGenerationTip: 'La generació automàtica recuperarà la imatge destacada seleccionada.',
    lengthTipDescription:
      'Això hauria de ser entre {{minLength}} i {{maxLength}} caràcters. Per obtenir ajuda per escriure descripcions meta de qualitat, consulta ',
    lengthTipTitle:
      'Això hauria de ser entre {{minLength}} i {{maxLength}} caràcters. Per obtenir ajuda per escriure títols meta de qualitat, consulta ',
    missing: 'Falta',
    noImage: 'Sense imatge',
    preview: 'Previsualització',
    previewDescription:
      'Els resultats exactes poden variar segons el contingut i la rellevància de la cerca.',
    tooLong: 'Massa llarg',
    tooShort: 'Massa curt',
  },
}
