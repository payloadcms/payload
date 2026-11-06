export type RelationshipCellValue = {
  relationTo: string
  value: number | string
}

/** Normalize populated documents and bare IDs for the table's relationship loader. */
export function getRelationshipCellValues({
  cellData,
  limit = 3,
  relationTo,
}: {
  cellData: unknown
  limit?: number
  relationTo?: string | string[]
}): RelationshipCellValue[] {
  const cells = Array.isArray(cellData) ? cellData : [cellData]
  const values: RelationshipCellValue[] = []

  for (const cell of cells.slice(0, limit)) {
    const isPolymorphic =
      cell && typeof cell === 'object' && 'relationTo' in cell && 'value' in cell
    const collection = isPolymorphic ? cell.relationTo : relationTo
    const value = isPolymorphic ? cell.value : cell
    const id = value && typeof value === 'object' && 'id' in value ? value.id : value

    if (typeof collection === 'string' && (typeof id === 'string' || typeof id === 'number')) {
      values.push({ relationTo: collection, value: id })
    }
  }

  return values
}
