import type { InlineToolbarGroup, InlineToolbarGroupItem } from '../../toolbars/inline/types.js'

export const inlineToolbarFormatGroupWithItems = (
  items: InlineToolbarGroupItem[],
): InlineToolbarGroup => {
  return {
    type: 'buttons',
    items,
    key: 'format',
    order: 4,
  }
}
