import type { RichTextCustomElement } from '../../../types.d.ts'

import { ListItemElement } from './ListItem.js'

const listItem: RichTextCustomElement = {
  name: 'li',
  Element: ListItemElement,
}

export default listItem
