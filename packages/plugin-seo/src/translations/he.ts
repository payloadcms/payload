import type { GenericTranslationsObject } from '@payloadcms/translations'

export const he: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'כמעט שם',
    autoGenerate: 'הפקה אוטומטית',
    bestPractices: 'הצעות טובות',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} תו, ',
    charactersLeftOver: '{{characters}} נותרו',
    charactersToGo: '{{characters}} להקליד',
    charactersTooMany: '{{characters}} יותר מידי',
    checksPassing: '{{current}}/{{max}} בדיקות עברו בהצלחה',
    good: 'טוב',
    imageAutoGenerationTip: 'ההפקה האוטומטית תמשוך את התמונה הראשית שנבחרה.',
    lengthTipDescription:
      'זה צריך להיות בין {{minLength}} ו{{maxLength}} תו. לעזרה בכתיבת תיאורי מטא איכותיים, עיין ב-',
    lengthTipTitle:
      'זה צריך להיות בין {{minLength}} ו{{maxLength}} תו. לעזרה בכתיבת כותרות מטא איכותיות, עיין ב-',
    missing: 'חסר',
    noImage: 'אין תמונה',
    preview: 'תצוגה מקדימה',
    previewDescription: 'תוצאות מדויקות עשויות להשתנות בהתאם לתוכן ולרלוונטיות של החיפוש.',
    tooLong: 'ארוך מידי',
    tooShort: 'קצר מידי',
  },
}
