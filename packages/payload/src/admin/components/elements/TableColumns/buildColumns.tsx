import React from 'react'

import type { SanitizedCollectionConfig } from '../../../../collections/config/types'
import type { Props as CellProps } from '../../views/collections/List/Cell/types'
import type { Column } from '../Table/types'

import { fieldIsPresentationalOnly } from '../../../../fields/config/types'
import flattenFields from '../../../../utilities/flattenTopLevelFields'
import Cell from '../../views/collections/List/Cell'
import SelectAll from '../../views/collections/List/SelectAll'
import SelectRow from '../../views/collections/List/SelectRow'
import SortColumn from '../SortColumn'

const buildColumns = ({
  cellProps,
  collection,
  columns,
}: {
  cellProps: Partial<CellProps>[]
  collection: SanitizedCollectionConfig
  columns: Pick<Column, 'accessor' | 'active'>[]
}): Column[] => {
  // sort the fields to the order of activeColumns
  const sortedFields = flattenFields(collection.fields, true).sort((a, b) => {
    const aIndex = columns.findIndex((column) => column.accessor === a.name)
    const bIndex = columns.findIndex((column) => column.accessor === b.name)
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  const firstActiveColumn = sortedFields.find(
    (field) => columns.find((column) => column.accessor === field.name)?.active,
  )

  let colIndex = -1
  const cols: Column[] = sortedFields.map((field) => {
    const isActive = columns.find((column) => column.accessor === field.name)?.active || false
    const isFirstActive = firstActiveColumn?.name === field.name
    if (isActive) {
      colIndex += 1
    }
    const props = cellProps?.[colIndex] || {}

    const fieldAffectsDataSubFields =
      field &&
      field.type &&
      (field.type === 'array' || field.type === 'group' || field.type === 'blocks')

    const disableListFilter =
      field.admin && 'disableListFilter' in field.admin ? field.admin.disableListFilter : false

    return {
      name: field.name,
      accessor: field.name,
      active: isActive,
      admin: {
        disableListColumn: field.admin?.disableListColumn,
        disableListFilter,
      },
      components: {
        Heading: (
          <SortColumn
            disable={fieldAffectsDataSubFields || fieldIsPresentationalOnly(field) || undefined}
            label={field.label || field.name}
            name={field.name}
          />
        ),
        renderCell: (rowData, cellData) => {
          return (
            <Cell
              cellData={cellData}
              colIndex={colIndex}
              collection={collection}
              field={field}
              key={JSON.stringify(cellData)}
              link={isFirstActive}
              rowData={rowData}
              {...props}
            />
          )
        },
      },
      label: field.label,
    }
  })

  if (cellProps?.[0]?.link !== false) {
    cols.unshift({
      name: '',
      accessor: '_select',
      active: true,
      components: {
        Heading: <SelectAll />,
        renderCell: (rowData) => <SelectRow id={rowData.id} />,
      },
      label: null,
    })
  }

  return cols
}

export default buildColumns
