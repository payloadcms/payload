import type { TextFormatTransformer } from '../../../packages/@lexical/markdown/MarkdownTransformers.js'

export const ITALIC_STAR: TextFormatTransformer = {
  type: 'text-format',
  format: ['italic'],
  tag: '*',
}

export const ITALIC_UNDERSCORE: TextFormatTransformer = {
  type: 'text-format',
  format: ['italic'],
  intraword: false,
  tag: '_',
}
