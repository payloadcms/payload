import { CellProps } from 'payload/types'
import { useComponentMap } from '../../providers/ComponentMapProvider'
import { Column } from '../../elements/Table/types'

export const buildColumns = (args: {
  columns: Pick<Column, 'accessor' | 'active'>[]
  getMappedFieldByPath: ReturnType<typeof useComponentMap>['getMappedFieldByPath']
  collectionSlug: string
  cellProps: Partial<CellProps>[]
}): Column[] => {
  const { columns, getMappedFieldByPath, collectionSlug, cellProps } = args

  return columns.map(({ accessor, active }, index) => {
    const field = getMappedFieldByPath({ path: accessor, collectionSlug })
    if (!field) console.warn(`No field found for ${accessor} in ${collectionSlug}`)
    if (field) {
      const column: Column = {
        accessor,
        active,
        label: field.label,
        name: field.name,
        components: {
          Cell: field.Cell,
          Heading: field.Heading,
        },
        cellProps: cellProps?.[index],
      }

      return column
    }
  })
}
