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
    const accessor = (field as any).accessor ?? ('name' in field ? field.name : undefined)
    return Boolean(columns.find((column) => column.accessor === accessor)?.active)
  } else if (activeColumnsIndices.length < 4) {
    return true
  }

  return false
}
