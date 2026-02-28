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
  onSelect: (id: number | string) => void
}
