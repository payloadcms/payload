import type {
  InlineToolbarGroup,
  InlineToolbarGroupItem,
} from '../../../lexical/plugins/toolbars/inline/types.js'

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
