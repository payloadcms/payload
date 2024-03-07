import type { CellProps, SanitizedCollectionConfig } from 'payload/types'

import React from 'react'

import type { ColumnPreferences } from '../../providers/ListInfo/types.js'
import type { FieldMap } from '../../utilities/buildComponentMap/types.js'
import type { Column } from '../Table/types.js'

import { SelectAll } from '../SelectAll/index.js'
import { SelectRow } from '../SelectRow/index.js'

export const buildColumns = (args: {
  cellProps: Partial<CellProps>[]
  columnPreferences: ColumnPreferences
  defaultColumns?: string[]
  enableRowSelections: boolean
  fieldMap: FieldMap
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}): Column[] => {
  const {
    cellProps,
    columnPreferences,
    defaultColumns,
    enableRowSelections,
    fieldMap,
    useAsTitle,
  } = args

  let sortedFieldMap = fieldMap

  const sortTo = defaultColumns || columnPreferences

  if (sortTo) {
    // sort the fields to the order of `defaultColumns` or `columnPreferences`
    // TODO: flatten top level field, i.e. `flattenTopLevelField()` from `payload` but that is typed for `Field`, not `fieldMap`
    sortedFieldMap = fieldMap.sort((a, b) => {
      const aIndex = sortTo.findIndex((column) => column.accessor === a.name)
      const bIndex = sortTo.findIndex((column) => column.accessor === b.name)
      if (aIndex === -1 && bIndex === -1) return 0
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }

  let numberOfActiveColumns = 0

  const sorted = sortedFieldMap.reduce((acc, field, index) => {
    const columnPreference = columnPreferences?.find(
      (preference) => preference.accessor === field.name,
    )

    let active = false

    if (columnPreference) {
      active = columnPreference.active
    } else if (defaultColumns && Array.isArray(defaultColumns) && defaultColumns.length > 0) {
      active = defaultColumns.includes(field.name)
    } else if (numberOfActiveColumns < 4) {
      active = true
    }

    if (active) {
      numberOfActiveColumns += 1
    }

    if (field) {
      const column: Column = {
        name: field.name,
        accessor: field.name,
        active,
        cellProps: {
          ...cellProps?.[index],
          link: (numberOfActiveColumns === 1 && active && enableRowSelections) || undefined,
        },
        components: {
          Cell: field.Cell,
          Heading: field.Heading,
        },
        label: field.label,
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
