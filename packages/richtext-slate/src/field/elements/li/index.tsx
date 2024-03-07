import type { RichTextCustomElement } from '../../../types.js'

import { ListItemElement } from './ListItem.js'

export const li: RichTextCustomElement = {
  name: 'li',
  Element: ListItemElement,
}
