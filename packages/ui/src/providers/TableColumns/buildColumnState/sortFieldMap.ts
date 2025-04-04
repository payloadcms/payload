import type { ClientField, ColumnPreference, Field } from 'payload'

export function sortFieldMap<T extends ClientField | Field>(
  fieldMap: T[],
  sortTo: ColumnPreference[],
): T[] {
  return fieldMap?.sort((a, b) => {
    const aIndex = sortTo.findIndex((column) => 'name' in a && column.accessor === a.name)
    const bIndex = sortTo.findIndex((column) => 'name' in b && column.accessor === b.name)

    if (aIndex === -1 && bIndex === -1) {
      return 0
    }

    if (aIndex === -1) {
      return 1
    }

    if (bIndex === -1) {
      return -1
    }

    return aIndex - bIndex
  })
}
