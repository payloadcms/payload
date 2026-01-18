import type { RichTextCustomElement } from '../../../types.js'

import { indentType } from './shared.js'

export const indent: RichTextCustomElement = {
  name: indentType,
  Button: '@payloadcms/richtext-slate/client#IndentButton',
  Element: '@payloadcms/richtext-slate/client#IndentElement',
}
