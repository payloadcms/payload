import type { RichTextCustomLeaf } from '../../types.js'

import { bold } from './bold/index.js'
import { code } from './code/index.js'
import { italic } from './italic/index.js'
import { strikethrough } from './strikethrough/index.js'
import { underline } from './underline/index.js'

export const defaultLeaves: Record<string, RichTextCustomLeaf> = {
  bold,
  code,
  italic,
  strikethrough,
  underline,
}
