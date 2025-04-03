import type { SanitizedCollectionPermission } from '../../auth/types.js'
import type {
  CollectionAdminOptions,
  SanitizedCollectionConfig,
} from '../../collections/config/types.js'
import type { ServerProps } from '../../config/types.js'
import type { ListPreferences } from '../../preferences/types.js'
import type { QueryPreset } from '../../query-presets/types.js'
import type { ResolvedFilterOptions } from '../../types/index.js'
import type { Column } from '../elements/Table.js'
import type { Data } from '../types.js'

export type ListViewSlots = {
  AfterList?: React.ReactNode
  AfterListTable?: React.ReactNode
  BeforeList?: React.ReactNode
  BeforeListTable?: React.ReactNode
  Description?: React.ReactNode
  listMenuItems?: React.ReactNode[]
  Table: React.ReactNode
}

/**
 * The `ListViewServerPropsOnly` approach is needed to ensure type strictness when injecting component props
 * There is no way to do something like `Omit<ListViewServerProps, keyof ListViewClientProps>`
 * This is because `ListViewClientProps` is a union which is impossible to exclude from
 * Exporting explicitly defined `ListViewServerPropsOnly`, etc. allows for the strictest typing
 */
export type ListViewServerPropsOnly = {
  collectionConfig: SanitizedCollectionConfig
  data: Data
  limit: number
  listPreferences: ListPreferences
  listSearchableFields: CollectionAdminOptions['listSearchableFields']
} & ServerProps

export type ListViewServerProps = ListViewClientProps & ListViewServerPropsOnly

export type ListViewClientProps = {
  beforeActions?: React.ReactNode[]
  collectionSlug: SanitizedCollectionConfig['slug']
  columnState: Column[]
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  disableQueryPresets?: boolean
  enableRowSelections?: boolean
  hasCreatePermission: boolean
  /**
   * @deprecated
   */
  listPreferences?: ListPreferences
  newDocumentURL: string
  /**
   * @deprecated
   */
  preferenceKey?: string
  queryPreset?: QueryPreset
  queryPresetPermissions?: SanitizedCollectionPermission
  renderedFilters?: Map<string, React.ReactNode>
  resolvedFilterOptions?: Map<string, ResolvedFilterOptions>
} & ListViewSlots

export type ListViewSlotSharedClientProps = {
  collectionSlug: SanitizedCollectionConfig['slug']
  hasCreatePermission: boolean
  newDocumentURL: string
}

// BeforeList
export type BeforeListClientProps = ListViewSlotSharedClientProps
export type BeforeListServerPropsOnly = {} & ListViewServerPropsOnly
export type BeforeListServerProps = BeforeListClientProps & BeforeListServerPropsOnly

// BeforeListTable
export type BeforeListTableClientProps = ListViewSlotSharedClientProps
export type BeforeListTableServerPropsOnly = {} & ListViewServerPropsOnly
export type BeforeListTableServerProps = BeforeListTableClientProps & BeforeListTableServerPropsOnly

// AfterList
export type AfterListClientProps = ListViewSlotSharedClientProps
export type AfterListServerPropsOnly = {} & ListViewServerPropsOnly
export type AfterListServerProps = AfterListClientProps & AfterListServerPropsOnly

// AfterListTable
export type AfterListTableClientProps = ListViewSlotSharedClientProps
export type AfterListTableServerPropsOnly = {} & ListViewServerPropsOnly
export type AfterListTableServerProps = AfterListTableClientProps & AfterListTableServerPropsOnly
