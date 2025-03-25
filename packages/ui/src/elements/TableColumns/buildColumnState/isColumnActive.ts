import type { ClientField, ColumnPreference } from 'payload'

export function isColumnActive({
  activeColumnsIndices,
  columnPreference,
  columns,
  field,
}: {
  activeColumnsIndices: number[]
  columnPreference: ColumnPreference
  columns: ColumnPreference[]
  field: ClientField
}) {
  if (columnPreference) {
    return columnPreference.active
  } else if (columns && Array.isArray(columns) && columns.length > 0) {
    return Boolean(
      columns.find((column) => field && 'name' in field && column.accessor === field.name)?.active,
    )
  } else if (activeColumnsIndices.length < 4) {
    return true
  }

  return false
}
