import type { ColumnPreference } from 'payload'

export function isColumnActive({
  accessor,
  activeColumnsIndices,
  columnPreference,
  columns,
}: {
  accessor: string
  activeColumnsIndices: number[]
  columnPreference: ColumnPreference
  columns: ColumnPreference[]
}) {
  if (columnPreference) {
    return columnPreference.active
  } else if (columns && Array.isArray(columns) && columns.length > 0) {
    return Boolean(columns.find((column) => column.accessor === accessor)?.active)
  } else if (activeColumnsIndices.length < 4) {
    return true
  }

  return false
}
