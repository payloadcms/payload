import type { TextFormatTransformer } from '@lexical/markdown'

export const STRIKETHROUGH: TextFormatTransformer = {
  format: ['strikethrough'],
  tag: '~~',
  type: 'text-format',
}
