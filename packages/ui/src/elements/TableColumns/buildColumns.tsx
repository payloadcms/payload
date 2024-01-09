import React from 'react'

import type { SanitizedCollectionConfig, SanitizedConfig } from 'payload/types'
import { I18n } from '@payloadcms/translations'

import type { CellProps } from '../../views/List/Cell/types'
import type { Column } from '../Table/types'
import { fieldIsPresentationalOnly } from 'payload/types'
import { flattenTopLevelFields } from 'payload/utilities'
import Cell from '../../views/List/Cell'
import SelectAll from '../../views/List/SelectAll'
import SelectRow from '../../views/List/SelectRow'
import SortColumn from '../SortColumn'

const buildColumns = ({
  cellProps,
  config,
  i18n,
  collectionConfig,
  columns,
}: {
  cellProps: Partial<CellProps>[]
  config: SanitizedConfig
  i18n: I18n
  collectionConfig: SanitizedCollectionConfig
  columns: Pick<Column, 'accessor' | 'active'>[]
}): Column[] => {
  // sort the fields to the order of activeColumns
  const sortedFields = flattenTopLevelFields(collectionConfig.fields, true).sort((a, b) => {
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
    return {
      name: field.name,
      accessor: field.name,
      active: isActive,
      components: {
        Heading: (
          <SortColumn
            disable={
              ('disableSort' in field && Boolean(field.disableSort)) ||
              fieldIsPresentationalOnly(field) ||
              undefined
            }
            label={field.label || field.name}
            name={field.name}
          />
        ),
        renderCell: (rowData, cellData) => {
          return (
            <Cell
              cellData={cellData}
              colIndex={colIndex}
              config={config}
              collectionConfig={collectionConfig}
              field={field}
              key={JSON.stringify(cellData)}
              link={isFirstActive}
              rowData={rowData}
              i18n={i18n}
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
