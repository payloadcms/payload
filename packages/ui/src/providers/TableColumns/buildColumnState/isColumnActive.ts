import type { ColumnPreference } from 'payload'

export function isColumnActive({
  activeColumnsIndices,
  columnPreference,
  columns,
  accessor,
}: {
  activeColumnsIndices: number[]
  columnPreference: ColumnPreference
  columns: ColumnPreference[]
  accessor: string
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
