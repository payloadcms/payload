import type { RichTextCustomElement } from '../../..'

import { IndentButton } from './Button'
import { IndentElement } from './Element'
import { indentType } from './shared'

const indent: RichTextCustomElement = {
  name: indentType,
  Button: IndentButton,
  Element: IndentElement,
}

export default indent
