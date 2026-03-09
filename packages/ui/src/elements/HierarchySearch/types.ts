export type SearchResult = {
  [key: string]: unknown
  _h_titlePath?: string
  id: number | string
  path: string
}

export type HierarchySearchProps = {
  collectionSlug: string
  collectionSpecificOptions?: { label: string; value: string }[]
  isActive: boolean
  onActiveChange: (isActive: boolean) => void
  onFilterChange?: (values: string[]) => void
  onSelect: (id: number | string) => void
  selectedFilters?: string[]
}
