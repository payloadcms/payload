import type { TextFormatTransformer } from '@lexical/markdown'

export const STRIKETHROUGH: TextFormatTransformer = {
  type: 'text-format',
  format: ['strikethrough'],
  tag: '~~',
}
