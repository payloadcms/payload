import type { InlineToolbarGroup, InlineToolbarGroupItem } from '../../toolbars/inline/types.js'

import { TextIcon } from '../../../lexical/ui/icons/Text/index.js'

export const inlineToolbarTextDropdownGroupWithItems = (
  items: InlineToolbarGroupItem[],
): InlineToolbarGroup => {
  return {
    type: 'dropdown',
    ChildComponent: TextIcon,
    items,
    key: 'text',
    order: 1,
  }
}
