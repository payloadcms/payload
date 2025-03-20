import type {
  ClientCollectionConfig,
  QueryPreset,
  ResolvedFilterOptions,
  SanitizedCollectionPermission,
  Where,
} from 'payload'

export type ListControlsProps = {
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
  readonly disableQueryPresets?: boolean
  readonly enableColumns?: boolean
  readonly enableSort?: boolean
  readonly handleSearchChange?: (search: string) => void
  readonly handleSortChange?: (sort: string) => void
  readonly handleWhereChange?: (where: Where) => void
  readonly listMenuItems?: React.ReactNode[]
  readonly queryPreset?: QueryPreset
  readonly queryPresetPermissions?: SanitizedCollectionPermission
  readonly renderedFilters?: Map<string, React.ReactNode>
  readonly resolvedFilterOptions?: Map<string, ResolvedFilterOptions>
}
