import type { ToolbarGroup, ToolbarGroupItem } from '../../toolbars/types.js'

import { AddIcon } from '../../../lexical/ui/icons/Add/index.js'

export const toolbarAddDropdownGroupWithItems = (items: ToolbarGroupItem[]): ToolbarGroup => {
  return {
    type: 'dropdown',
    ChildComponent: AddIcon,
    items,
    key: 'add',
    order: 10,
  }
}
