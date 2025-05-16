import type { Column, ListPreferences } from 'payload'

import type { SortColumnProps } from '../../elements/SortColumn/index.js'

export interface ITableColumns {
  columns: Column[]
  LinkedCellOverride?: React.ReactNode
  moveColumn: (args: { fromIndex: number; toIndex: number }) => Promise<void>
  resetColumnsState: () => Promise<void>
  /**
   * Sets specified columns to active state while preserving:
   * 1. The original column order
   * 2. The active state of columns not mentioned in the input array
   *
   * @param columns Array of column names to set to active state
   * @deprecated Use setColumns if you want to replace the entire column list
   */
  setActiveColumns: (columns: string[]) => Promise<void>
  /**
   * Replaces the entire column list with the specified columns.
   * This will override both column order and active states.
   *
   * @param columns Array of column names for the new column list
   */
  setColumns: (columns: string[]) => Promise<void>
  toggleColumn: (column: string) => Promise<void>
}

export type TableColumnsProviderProps = {
  readonly children: React.ReactNode
  readonly collectionSlug: string | string[]
  readonly columnState: Column[]
  /**
   * @deprecated
   */
  readonly docs?: any[]
  /**
   * @deprecated
   */
  readonly enableRowSelections?: boolean
  readonly LinkedCellOverride?: React.ReactNode
  /**
   * @deprecated
   */
  readonly listPreferences?: ListPreferences
  /**
   * @deprecated
   */
  readonly preferenceKey?: string
  /**
   * @deprecated
   */
  readonly renderRowTypes?: boolean
  /**
   * @deprecated
   */
  readonly setTable?: (Table: React.ReactNode) => void
  /**
   * @deprecated
   */
  readonly sortColumnProps?: Partial<SortColumnProps>
  /**
   * @deprecated
   */
  readonly tableAppearance?: 'condensed' | 'default'
}
