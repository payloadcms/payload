export type ItemKey = `${string}-${number | string}`
export type SectionItem = {
  itemKey: ItemKey
  name: string
  rows?: SectionItem[]
} & Record<string, any>

export type Column = {
  label?: string
  name: string
}

export type NestedSectionsTableProps = {
  className?: string
  columns?: Column[]
  dropContextName: string
  initialOffset?: number
  loadingItemKeys?: Set<ItemKey>
  onDrop?: (params: { targetItemKey: ItemKey | null }) => Promise<void>
  onEscape: () => void
  onItemSelection?: (args: {
    eventOptions: {
      ctrlKey: boolean
      metaKey: boolean
      shiftKey: boolean
    }
    itemKey: ItemKey
  }) => void
  onSelectAll: () => void
  openItemKeys?: Set<ItemKey>
  rootItems: SectionItem[]
  segmentWidth?: number
  selectedItemKeys: Set<ItemKey>
  toggleItemExpand: (itemKey: ItemKey) => void
  updateSelections: (args: { itemKeys: ItemKey[] | Set<ItemKey> }) => void
}
