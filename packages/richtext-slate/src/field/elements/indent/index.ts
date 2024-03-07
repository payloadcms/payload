import type { RichTextCustomElement } from '../../../types.d.ts'

import { IndentButton } from './Button.js'
import { IndentElement } from './Element.js'
import { indentType } from './shared.js'

export const indent: RichTextCustomElement = {
  name: indentType,
  Button: IndentButton,
  Element: IndentElement,
}
