import type { Column, ListPreferences } from 'payload'

import type { SortColumnProps } from '../../elements/SortColumn/index.js'

export type TableColumnsProviderProps = {
  readonly children: React.ReactNode
  readonly collectionSlug: string | string[]
  readonly columnState: Column[]
  readonly docs: any[]
  readonly enableRowSelections?: boolean
  readonly LinkedCellOverride?: React.ReactNode
  readonly listPreferences?: ListPreferences
  readonly preferenceKey: string
  readonly renderRowTypes?: boolean
  readonly setTable: (Table: React.ReactNode) => void
  readonly sortColumnProps?: Partial<SortColumnProps>
  readonly tableAppearance?: 'condensed' | 'default'
}

export interface ITableColumns {
  columns: Column[]
  LinkedCellOverride?: React.ReactNode
  modified: boolean
  moveColumn: (args: { fromIndex: number; toIndex: number }) => Promise<void>
  resetColumnsState: () => Promise<void>
  setActiveColumns: (columns: string[]) => Promise<void>
  setModified: (modified: boolean) => void
  toggleColumn: (column: string) => Promise<void>
}
