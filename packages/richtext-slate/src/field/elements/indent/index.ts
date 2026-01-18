import type { RichTextCustomElement } from '../../../types.js'

import { indentType } from './shared.js'

export const indent: RichTextCustomElement = {
  name: indentType,
  Button: '@ruya.sa/richtext-slate/client#IndentButton',
  Element: '@ruya.sa/richtext-slate/client#IndentElement',
}
