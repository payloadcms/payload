import type { ClientCollectionConfig, ListPreset, ResolvedFilterOptions, Where } from 'payload'

export type ListControlsProps = {
  readonly activePreset?: ListPreset
  readonly beforeActions?: React.ReactNode[]
  readonly collectionConfig: ClientCollectionConfig
  readonly collectionSlug: string
  /**
   * @deprecated
   * These are now handled by the `ListSelection` component
   */
  readonly disableBulkDelete?: boolean
  /**
   * @deprecated
   * These are now handled by the `ListSelection` component
   */
  readonly disableBulkEdit?: boolean
  readonly disableListPresets?: boolean
  readonly enableColumns?: boolean
  readonly enableSort?: boolean
  readonly handleSearchChange?: (search: string) => void
  readonly handleSortChange?: (sort: string) => void
  readonly handleWhereChange?: (where: Where) => void
  readonly listMenuItems?: React.ReactNode[]
  readonly renderedFilters?: Map<string, React.ReactNode>
  readonly resolvedFilterOptions?: Map<string, ResolvedFilterOptions>
}
