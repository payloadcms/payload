import type { ToolbarGroup, ToolbarGroupItem } from '../../toolbars/types.js'

import { TextIcon } from '../../../lexical/ui/icons/Text/index.js'

export const toolbarTextDropdownGroupWithItems = (items: ToolbarGroupItem[]): ToolbarGroup => {
  return {
    type: 'dropdown',
    ChildComponent: TextIcon,
    items,
    key: 'text',
    order: 25,
  }
}
