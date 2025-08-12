import type { GenericTranslationsObject } from '@payloadcms/translations'

export const zh: GenericTranslationsObject = {
  $schema: './translation-schema.json',
  'plugin-seo': {
    almostThere: '快完成了',
    autoGenerate: '自动生成',
    bestPractices: '最佳实践',
    characterCount: '{{current}}/{{minLength}}-{{maxLength}} 字符, ',
    charactersLeftOver: '{{characters}} 字符剩余',
    charactersToGo: '{{characters}} 字符待输入',
    charactersTooMany: '{{characters}} 字符太多',
    checksPassing: '{{current}}/{{max}} 检查通过',
    good: '好',
    imageAutoGenerationTip: '自动生成将获取选定的主图像。',
    lengthTipDescription:
      '此文本应介于 {{minLength}} 和 {{maxLength}} 个字符之间。如需有关编写高质量 meta 描述的帮助，请参见 ',
    lengthTipTitle:
      '此文本应介于 {{minLength}} 和 {{maxLength}} 个字符之间。如需有关编写高质量 meta 标题的帮助，请参见 ',
    missing: '缺失',
    noImage: '没有图片',
    preview: '预览',
    previewDescription: '实际搜索结果可能会根据内容和搜索相关性有所不同。',
    tooLong: '太长',
    tooShort: '太短',
  },
}
