import React from 'react'

import type { SanitizedCollectionConfig, SanitizedConfig, CellProps } from 'payload/types'

import { fieldIsPresentationalOnly } from 'payload/types'
import { flattenTopLevelFields } from 'payload/utilities'
import { DefaultCell } from '../../../views/List/Cell'
import SelectAll from '../../../views/List/SelectAll'
import SelectRow from '../../../views/List/SelectRow'
import SortColumn from '../../../elements/SortColumn'
import { Column } from '../../../elements/Table/types'
import { RenderCustomComponent } from '../../../elements/RenderCustomComponent'
import { getDisplayableFields } from './getDisplayableFields'

export const mapColumns = ({
  cellProps,
  config,
  collectionConfig,
}: {
  cellProps: Partial<CellProps>[]
  config: SanitizedConfig
  collectionConfig: SanitizedCollectionConfig
}): Column[] => {
  const columnsToDisplay = getDisplayableFields(collectionConfig)
  const columns = columnsToDisplay.map((field) => ({
    accessor: field.name,
    active: true,
  }))

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

  const cols = sortedFields.map((field) => {
    const isActive = columns.find((column) => column.accessor === field.name)?.active || false
    const isFirstActive = firstActiveColumn?.name === field.name

    if (isActive) {
      colIndex += 1
    }

    // const props = cellProps?.[colIndex] || {}

    const cellProps: CellProps = {
      colIndex,
      field,
      link: isFirstActive,
      adminRoute: config.routes.admin,
    }

    const mappedColumn: Column = {
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
        Cell: (
          <RenderCustomComponent
            DefaultComponent={DefaultCell}
            CustomComponent={field.admin?.components?.Cell}
            componentProps={cellProps}
          />
        ),
      },
      label: field.label,
    }

    return mappedColumn
  })

  if (cellProps?.[0]?.link !== false) {
    cols.unshift({
      name: '',
      accessor: '_select',
      active: true,
      components: {
        Heading: <SelectAll />,
        Cell: <SelectRow />,
      },
      label: null,
    })
  }

  return cols
}
