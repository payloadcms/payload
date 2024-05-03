import type { InlineToolbarGroup, InlineToolbarGroupItem } from '../toolbars/inline/types.js'

export const indentGroupWithItems = (items: InlineToolbarGroupItem[]): InlineToolbarGroup => {
  return {
    type: 'buttons',
    items,
    key: 'indent',
    order: 3,
  }
}
