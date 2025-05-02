import type { TextFormatTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

export const STRIKETHROUGH: TextFormatTransformer = {
  type: 'text-format',
  format: ['strikethrough'],
  tag: '~~',
}
