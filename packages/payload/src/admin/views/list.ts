import type { ListPreferences } from '../../preferences/types.js'
import type { ResolvedFilterOptions } from '../../types/index.js'
import type { Column } from '../elements/Table.js'

export type ListViewSlots = {
  AfterList?: React.ReactNode
  AfterListTable?: React.ReactNode
  BeforeList?: React.ReactNode
  BeforeListTable?: React.ReactNode
  Description?: React.ReactNode
  Table: React.ReactNode
}

export type ListViewClientProps = {
  beforeActions?: React.ReactNode[]
  collectionSlug: string
  columnState: Column[]
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections?: boolean
  hasCreatePermission: boolean
  listPreferences?: ListPreferences
  newDocumentURL: string
  preferenceKey?: string
  renderedFilters?: Map<string, React.ReactNode>
  resolvedFilterOptions?: Map<string, ResolvedFilterOptions>
} & ListViewSlots
