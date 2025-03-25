import type { Column, ListPreferences } from 'payload'

import type { SortColumnProps } from '../../elements/SortColumn/index.js'

export interface ITableColumns {
  columns: Column[]
  LinkedCellOverride?: React.ReactNode
  moveColumn: (args: { fromIndex: number; toIndex: number }) => Promise<void>
  resetColumnsState: () => Promise<void>
  setActiveColumns: (columns: string[]) => Promise<void>
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
