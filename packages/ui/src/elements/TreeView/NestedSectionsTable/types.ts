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
  canFocusItem: (item: SectionItem) => boolean
  className?: string
  columns?: Column[]
  dropContextName: string
  initialOffset?: number
  loadingItemKeys?: Set<ItemKey>
  onDrop?: (params: { targetItemKey: ItemKey | null }) => Promise<void>
  // onEnter: (item: SectionItem) => void
  onEscape: () => void
  onItemDrag?: (params: { event: PointerEvent; item: null | SectionItem }) => void
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
