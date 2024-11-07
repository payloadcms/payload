import type { GenericTranslationsObject } from '@payloadcms/translations'

export const tr: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Neredeyse tamam',
    autoGenerate: 'Otomatik oluştur',
    bestPractices: 'en iyi uygulamalar',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} karakter, ',
    charactersLeftOver: '{{characters}} karakter kaldı',
    charactersToGo: '{{characters}} karakter kaldı',
    charactersTooMany: '{{characters}} karakter fazla',
    checksPassing: '{{current}}/{{max}} kontrol başarılı',
    good: 'İyi',
    imageAutoGenerationTip: 'Otomatik oluşturma, seçilen ana görseli alacaktır.',
    lengthTipDescription:
      '{{minLength}} ile {{maxLength}} karakter arasında olmalıdır. Kaliteli meta açıklamaları yazmak için yardım almak için bkz. ',
    lengthTipTitle:
      '{{minLength}} ile {{maxLength}} karakter arasında olmalıdır. Kaliteli meta başlıkları yazmak için yardım almak için bkz. ',
    missing: 'Eksik',
    noImage: 'Görsel yok',
    preview: 'Önizleme',
    previewDescription: 'Kesin sonuç listeleri içeriğe ve arama alâkasına göre değişebilir.',
    tooLong: 'Çok uzun',
    tooShort: 'Çok kısa',
  },
}
