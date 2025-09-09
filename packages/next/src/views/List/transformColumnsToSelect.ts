import type { ColumnPreference, SelectType } from 'payload'

export const transformColumnsToSelect = (columns: ColumnPreference[]): SelectType =>
  columns.reduce((acc, column) => {
    if (column.active) {
      acc[column.accessor] = true
    }
    return acc
  }, {} as SelectType)
