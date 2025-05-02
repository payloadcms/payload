import type { GenericTranslationsObject } from '@payloadcms/translations'

export const vi: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: 'Gần đạt',
    autoGenerate: 'Tự động tạo',
    bestPractices: 'các phương pháp hay nhất',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} kí tự, ',
    charactersLeftOver: 'còn lại {{characters}}',
    charactersToGo: 'Còn {{characters}} ký tự nữa',
    charactersTooMany: 'vượt quá {{characters}} ký tự',
    checksPassing: '{{current}}/{{max}} đã đạt',
    good: 'Tốt',
    imageAutoGenerationTip: 'Tính năng tự động tạo sẽ lấy ảnh đầu tiên được chọn.',
    lengthTipDescription:
      'Độ dài nên từ {{minLength}}-{{maxLength}} kí tự. Để được hướng dẫn viết mô tả meta chất lượng, hãy xem ',
    lengthTipTitle:
      'Độ dài nên từ {{minLength}}-{{maxLength}} kí tự. Để được hướng dẫn viết mô tả meta chất lượng, hãy xem ',
    missing: 'Không đạt',
    noImage: 'Chưa có ảnh',
    preview: 'Xem trước',
    previewDescription: 'Kết quả hiển thị có thể thay đổi tuỳ theo nội dung và công cụ tìm kiếm.',
    tooLong: 'Quá dài',
    tooShort: 'Quá ngắn',
  },
}
