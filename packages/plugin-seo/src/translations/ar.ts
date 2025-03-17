import type { GenericTranslationsObject } from '@payloadcms/translations'

export const ar: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'قريبًا',
    autoGenerate: 'توليد تلقائي',
    bestPractices: 'أفضل الممارسات',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} أحرف، ',
    charactersLeftOver: '{{characters}} متبقية',
    charactersToGo: '{{characters}} للمضي قدمًا',
    charactersTooMany: '{{characters}} أكثر من اللازم',
    checksPassing: '{{current}}/{{max}} التحقق تم بنجاح',
    good: 'جيد',
    imageAutoGenerationTip: 'سيقوم التوليد التلقائي باسترجاع الصورة الرئيسية المحددة.',
    lengthTipDescription:
      'يجب أن يتراوح هذا بين {{minLength}} و{{maxLength}} حرفًا. للحصول على مساعدة في كتابة أوصاف ميتا ذات جودة، راجع ',
    lengthTipTitle:
      'يجب أن يتراوح هذا بين {{minLength}} و{{maxLength}} حرفًا. للحصول على مساعدة في كتابة عناوين ميتا ذات جودة، راجع ',
    missing: 'مفقود',
    noImage: 'لا توجد صورة',
    preview: 'معاينة',
    previewDescription: 'قد تختلف النتائج الدقيقة بناءً على المحتوى وملاءمة البحث.',
    tooLong: 'طويل جدًا',
    tooShort: 'قصير جدًا',
  },
}
