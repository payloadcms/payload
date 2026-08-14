export type SearchResult = {
  [key: string]: unknown
  _h_titlePath?: string
  id: number | string
  path: string
}

export type HierarchySearchProps = {
  collectionSlug: string
  isActive: boolean
  onActiveChange: (isActive: boolean) => void
  onSelect: ({ id }: { id: number | string }) => void
  /** Document new items are created under. `null` creates at the root level. */
  parentId: null | number | string
}
