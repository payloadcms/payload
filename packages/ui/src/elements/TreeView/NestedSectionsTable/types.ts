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
  hoveredRowID?: null | number | string
  initialOffset?: number
  isDragging?: boolean
  isRowFocusable: (row: SectionRow) => boolean
  loadingRowIDs?: Set<number | string>
  onDroppableHover: (params: {
    hoveredRowID?: number | string
    placement?: string
    targetItem: null | SectionRow
  }) => void
  onEnter: (row: SectionRow) => void
  onEscape: () => void
  onRowDrag?: (params: { event: PointerEvent; item: null | SectionRow }) => void
  onSelectAll: () => void
  openItemIDs?: Set<number | string>
  sections: SectionRow[]
  segmentWidth?: number
  selectedItemKeys: Set<ItemKey>
  targetParentID?: null | number | string
  toggleRowExpand: (docID: number | string) => void
  updateSelections: (args: { itemKeys: ItemKey[] | Set<ItemKey> }) => void
}
