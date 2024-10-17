import type { GenericTranslationsObject } from '@payloadcms/translations'

export const es: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Ya casi está',
    autoGenerate: 'Autogénerar',
    bestPractices: 'mejores prácticas',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} letras, ',
    charactersLeftOver: '{{characters}} letras sobrantes',
    charactersToGo: '{{characters}} letras sobrantes',
    charactersTooMany: '{{characters}} letras demasiados',
    checksPassing: '{{current}}/{{max}} las comprobaciones están pasando',
    good: 'Bien',
    imageAutoGenerationTip: 'La autogeneración recuperará la imagen de héroe seleccionada.',
    lengthTipDescription:
      'Esto debe estar entre {{minLength}} y {{maxLength}} caracteres. Para obtener ayuda sobre cómo escribir meta descripciones de calidad, consulte ',
    lengthTipTitle:
      'Debe tener entre {{minLength}} y {{maxLength}} caracteres. Para obtener ayuda sobre cómo escribir metatítulos de calidad, consulte ',
    missing: 'Falta',
    noImage: 'Sin imagen',
    preview: 'Vista previa',
    previewDescription:
      'Las listas de resultados pueden variar segun la relevancia de buesqueda y el contenido.',
    tooLong: 'Demasiado largo',
    tooShort: 'Demasiado corto',
  },
}
