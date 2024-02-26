import type { TextFormatTransformer } from '@lexical/markdown'

export const BOLD_ITALIC_STAR: TextFormatTransformer = {
  type: 'text-format',
  format: ['bold', 'italic'],
  tag: '***',
}

export const BOLD_ITALIC_UNDERSCORE: TextFormatTransformer = {
  type: 'text-format',
  format: ['bold', 'italic'],
  intraword: false,
  tag: '___',
}

export const BOLD_STAR: TextFormatTransformer = {
  type: 'text-format',
  format: ['bold'],
  tag: '**',
}

export const BOLD_UNDERSCORE: TextFormatTransformer = {
  type: 'text-format',
  format: ['bold'],
  intraword: false,
  tag: '__',
}
