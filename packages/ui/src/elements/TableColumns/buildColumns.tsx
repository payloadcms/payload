import type { CellProps, SanitizedCollectionConfig } from 'payload/types'

import React from 'react'

import type { FieldMap } from '../../providers/ComponentMap/buildComponentMap/types.js'
import type { ColumnPreferences } from '../../providers/ListInfo/types.js'
import type { Column } from '../Table/index.js'

import { SelectAll } from '../SelectAll/index.js'
import { SelectRow } from '../SelectRow/index.js'
import { DefaultCell } from '../Table/DefaultCell/index.js'

export const buildColumns = (args: {
  cellProps: Partial<CellProps>[]
  columnPreferences: ColumnPreferences
  defaultColumns?: string[]
  enableRowSelections: boolean
  fieldMap: FieldMap
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}): Column[] => {
  const { cellProps, columnPreferences, defaultColumns, enableRowSelections, fieldMap } = args

  let sortedFieldMap = fieldMap

  const sortTo = defaultColumns || columnPreferences

  if (sortTo) {
    // sort the fields to the order of `defaultColumns` or `columnPreferences`
    // TODO: flatten top level field, i.e. `flattenTopLevelField()` from `payload` but that is typed for `Field`, not `fieldMap`
    sortedFieldMap = fieldMap.sort((a, b) => {
      const aIndex = sortTo.findIndex((column) => 'name' in a && column.accessor === a.name)
      const bIndex = sortTo.findIndex((column) => 'name' in b && column.accessor === b.name)
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }

  const activeColumnsIndices = []

  const sorted = sortedFieldMap.reduce((acc, field, index) => {
    const columnPreference = columnPreferences?.find(
      (preference) => 'name' in field && preference.accessor === field.name,
    )

    let active = false

    if (columnPreference) {
      active = columnPreference.active
    } else if (defaultColumns && Array.isArray(defaultColumns) && defaultColumns.length > 0) {
      active = 'name' in field && defaultColumns.includes(field.name)
    } else if (activeColumnsIndices.length < 4) {
      active = true
    }

    if (active && !activeColumnsIndices.includes(index)) {
      activeColumnsIndices.push(index)
    }

    const isFirstActiveColumn = activeColumnsIndices[0] === index

    const name = 'name' in field ? field.name : undefined

    const Cell =
      field.CustomCell !== undefined ? (
        field.CustomCell
      ) : (
        <DefaultCell {...field.cellComponentProps} />
      )

    if (field) {
      const column: Column = {
        name,
        accessor: name,
        active,
        cellProps: {
          ...cellProps?.[index],
          link: isFirstActiveColumn,
        },
        components: {
          Cell,
          Heading: field.Heading,
        },
        label: 'label' in field.fieldComponentProps ? field.fieldComponentProps.label : undefined,
      }

      acc.push(column)
    }

    return acc
  }, [])

  if (enableRowSelections) {
    sorted.unshift({
      name: '',
      accessor: '_select',
      active: true,
      components: {
        Cell: <SelectRow />,
        Heading: <SelectAll />,
      },
      label: null,
    })
  }

  return sorted
}
