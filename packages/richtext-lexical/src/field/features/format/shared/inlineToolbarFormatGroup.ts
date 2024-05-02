import type {
  InlineToolbarGroup,
  InlineToolbarGroupItem,
} from '../../../lexical/plugins/toolbars/inline/types.js'

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
