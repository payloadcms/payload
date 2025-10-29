export type ItemKey = `${string}-${number | string}`
export type SectionRow = {
  name: string
  rowID: ItemKey
  rows?: SectionRow[]
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
  isRowFocusable: (row: SectionRow) => boolean
  loadingRowItemKeys?: Set<ItemKey>
  onDrop?: (params: { targetItemKey: ItemKey | null }) => Promise<void>
  // onEnter: (row: SectionRow) => void
  onEscape: () => void
  onItemSelection?: (args: {
    eventOptions: {
      ctrlKey: boolean
      metaKey: boolean
      shiftKey: boolean
    }
    itemKey: ItemKey
  }) => void
  onRowDrag?: (params: { event: PointerEvent; item: null | SectionRow }) => void
  onSelectAll: () => void
  openItemKeys?: Set<ItemKey>
  sections: SectionRow[]
  segmentWidth?: number
  selectedItemKeys: Set<ItemKey>
  toggleRowExpand: (docID: number | string) => void
  updateSelections: (args: { itemKeys: ItemKey[] | Set<ItemKey> }) => void
}
