'use client'
import type { ToolbarGroup, ToolbarGroupItem } from '../../toolbars/types.js'

export const toolbarFormatGroupWithItems = (items: ToolbarGroupItem[]): ToolbarGroup => {
  return {
    type: 'buttons',
    items,
    key: 'format',
    order: 40,
  }
}
