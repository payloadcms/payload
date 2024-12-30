import type { GenericTranslationsObject } from '@payloadcms/translations'

export const en: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Almost there',
    autoGenerate: 'Auto-generate',
    bestPractices: 'best practices',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} chars, ',
    charactersLeftOver: '{{characters}} left over',
    charactersToGo: '{{characters}} to go',
    charactersTooMany: '{{characters}} too many',
    checksPassing: '{{current}}/{{max}} checks are passing',
    good: 'Good',
    imageAutoGenerationTip: 'Auto-generation will retrieve the selected hero image.',
    lengthTipDescription:
      'This should be between {{minLength}} and {{maxLength}} characters. For help in writing quality meta descriptions, see ',
    lengthTipTitle:
      'This should be between {{minLength}} and {{maxLength}} characters. For help in writing quality meta titles, see ',
    missing: 'Missing',
    noImage: 'No image',
    preview: 'Preview',
    previewDescription: 'Exact result listings may vary based on content and search relevancy.',
    tooLong: 'Too long',
    tooShort: 'Too short',
  },
}
