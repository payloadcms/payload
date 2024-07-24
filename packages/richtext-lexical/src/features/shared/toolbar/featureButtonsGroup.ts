import type { ToolbarGroup, ToolbarGroupItem } from '../../toolbars/types.js'

export const toolbarFeatureButtonsGroupWithItems = (items: ToolbarGroupItem[]): ToolbarGroup => {
  return {
    type: 'buttons',
    items,
    key: 'features',
    order: 50,
  }
}
