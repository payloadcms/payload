import type {
  InlineToolbarGroup,
  InlineToolbarGroupItem,
} from '../../lexical/plugins/toolbars/inline/types.js'

import { AlignLeftIcon } from '../../lexical/ui/icons/AlignLeft/index.js'

export const alignGroupWithItems = (items: InlineToolbarGroupItem[]): InlineToolbarGroup => {
  return {
    type: 'dropdown',
    ChildComponent: AlignLeftIcon,
    items,
    key: 'align',
    order: 2,
  }
}
