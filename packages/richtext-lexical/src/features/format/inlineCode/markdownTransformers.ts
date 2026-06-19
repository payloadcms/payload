import type { TextFormatTransformer } from '@lexical/markdown'

export const INLINE_CODE: TextFormatTransformer = {
  type: 'text-format',
  format: ['code'],
  tag: '`',
}
