import type { RichTextCustomElement } from '../../../types.d.ts'

import { ListItemElement } from './ListItem.js'

export const li: RichTextCustomElement = {
  name: 'li',
  Element: ListItemElement,
}
