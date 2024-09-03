'use client'
import type { ToolbarGroup, ToolbarGroupItem } from '../../toolbars/types.js'

import { AlignLeftIcon } from '../../../lexical/ui/icons/AlignLeft/index.js'

export const toolbarAlignGroupWithItems = (items: ToolbarGroupItem[]): ToolbarGroup => {
  return {
    type: 'dropdown',
    ChildComponent: AlignLeftIcon,
    items,
    key: 'align',
    order: 30,
  }
}
