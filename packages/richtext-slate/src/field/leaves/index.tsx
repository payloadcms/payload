import type { RichTextCustomLeaf } from '../..'

import bold from './bold'
import code from './code'
import italic from './italic'
import strikethrough from './strikethrough'
import underline from './underline'

const defaultLeaves: Record<string, RichTextCustomLeaf> = {
  bold,
  code,
  italic,
  strikethrough,
  underline,
}

export default defaultLeaves
