import type { Column } from 'payload'

export interface ITableColumns {
  columns: Column[]
  LinkedCellOverride?: React.ReactNode
  moveColumn: (args: { fromIndex: number; toIndex: number }) => Promise<void>
  resetColumnsState: () => Promise<void>
  setActiveColumns: (columns: string[]) => Promise<void>
  setColumns: (columns: Column[]) => Promise<void>
  toggleColumn: (column: string) => Promise<void>
}

export type TableColumnsProviderProps = {
  readonly children: React.ReactNode
  readonly collectionSlug: string | string[]
  readonly columnState: Column[]
  readonly LinkedCellOverride?: React.ReactNode
}
