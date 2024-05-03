import type { InlineToolbarGroup, InlineToolbarGroupItem } from '../../toolbars/inline/types.js'

export const inlineToolbarFeatureButtonsGroupWithItems = (
  items: InlineToolbarGroupItem[],
): InlineToolbarGroup => {
  return {
    type: 'buttons',
    items,
    key: 'features',
    order: 5,
  }
}
