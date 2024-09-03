'use client'
import type { ToolbarGroup, ToolbarGroupItem } from '../../toolbars/types.js'

export const toolbarIndentGroupWithItems = (items: ToolbarGroupItem[]): ToolbarGroup => {
  return {
    type: 'buttons',
    items,
    key: 'indent',
    order: 35,
  }
}
