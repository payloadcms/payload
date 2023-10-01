import type { TextFormatTransformer } from '@lexical/markdown'

export const INLINE_CODE: TextFormatTransformer = {
  format: ['code'],
  tag: '`',
  type: 'text-format',
}
