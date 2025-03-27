import type { GenericTranslationsObject } from '@payloadcms/translations'

export const es: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Ya casi está',
    autoGenerate: 'Generar automáticamente',
    bestPractices: 'Mejores prácticas',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} caracteres, ',
    charactersLeftOver: '{{characters}} restantes',
    charactersToGo: '{{characters}} por completar',
    charactersTooMany: '{{characters}} de más',
    checksPassing: '{{current}}/{{max}} comprobaciones correctas',
    good: 'Bien',
    imageAutoGenerationTip: 'La generación automática recuperará la imagen de héroe seleccionada',
    lengthTipDescription:
      'Debe tener entre {{minLength}} y {{maxLength}} caracteres. Para obtener ayuda sobre cómo escribir meta descripciones de calidad, consulte ',
    lengthTipTitle:
      'Debe tener entre {{minLength}} y {{maxLength}} caracteres. Para obtener ayuda sobre cómo escribir meta títulos de calidad, consulte ',
    missing: 'Faltante',
    noImage: 'Sin imagen',
    preview: 'Vista previa',
    previewDescription:
      'Las resultados exactos pueden variar en función del contenido y la relevancia de la búsqueda.',
    tooLong: 'Demasiado largo',
    tooShort: 'Demasiado corto',
  },
}