import type { TextFormatTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

export const INLINE_CODE: TextFormatTransformer = {
  type: 'text-format',
  format: ['code'],
  tag: '`',
}
