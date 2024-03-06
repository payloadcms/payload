import type { RichTextCustomLeaf } from '../../types.d.ts'

import bold from './bold/index.js'
import code from './code/index.js'
import italic from './italic/index.js'
import strikethrough from './strikethrough/index.js'
import underline from './underline/index.js'

const defaultLeaves: Record<string, RichTextCustomLeaf> = {
  bold,
  code,
  italic,
  strikethrough,
  underline,
}

export default defaultLeaves
