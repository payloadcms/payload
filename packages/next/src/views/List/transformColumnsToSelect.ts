import type { ColumnPreference, SelectType } from 'payload'

import { unflatten } from 'payload/shared'

export const transformColumnsToSelect = (columns: ColumnPreference[]): SelectType => {
  const columnsSelect = columns.reduce((acc, column) => {
    if (column.active) {
      acc[column.accessor] = true
    }
    return acc
  }, {} as SelectType)

  return unflatten(columnsSelect)
}
