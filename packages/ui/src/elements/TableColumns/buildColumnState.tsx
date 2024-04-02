import { FieldLabel } from '@payloadcms/ui/forms/FieldLabel'
import { type CellComponentProps, type SanitizedCollectionConfig } from 'payload/types'
import React from 'react'

import type { FieldMap, MappedField } from '../../providers/ComponentMap/buildComponentMap/types.js'
import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
import type { Column } from '../Table/index.js'

import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'
import { SelectAll } from '../SelectAll/index.js'
import { SelectRow } from '../SelectRow/index.js'
import { SortColumn } from '../SortColumn/index.js'
import { DefaultCell } from '../Table/DefaultCell/index.js'

const fieldIsPresentationalOnly = (field: MappedField): boolean => field.type === 'ui'

type Args = {
  cellProps: Partial<CellComponentProps>[]
  columnPreferences: ColumnPreferences
  columns?: string[]
  enableRowSelections: boolean
  fieldMap: FieldMap
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}
export const buildColumnState = (args: Args): Column[] => {
  const { cellProps, columnPreferences, columns, enableRowSelections, fieldMap, useAsTitle } = args

  // swap useAsTitle field to first slot
  let sortedFieldMap = flattenFieldMap(fieldMap)
  const useAsTitleFieldIndex = sortedFieldMap.findIndex((field) => field.name === useAsTitle)
  if (useAsTitleFieldIndex !== -1) {
    const useAsTitleField = sortedFieldMap[useAsTitleFieldIndex]
    sortedFieldMap = [
      useAsTitleField,
      ...sortedFieldMap.slice(0, useAsTitleFieldIndex),
      ...sortedFieldMap.slice(useAsTitleFieldIndex + 1),
    ]
  }

  const sortTo = columnPreferences || columns

  if (sortTo) {
    // sort the fields to the order of `defaultColumns` or `columnPreferences`
    sortedFieldMap = sortedFieldMap.sort((a, b) => {
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
    } else if (columns && Array.isArray(columns) && columns.length > 0) {
      active = 'name' in field && columns.includes(field.name)
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

    const Label = (
      <FieldLabel
        CustomLabel={field.fieldComponentProps.CustomLabel}
        {...field.fieldComponentProps.labelProps}
        unstyled
      />
    )

    const Heading = (
      <SortColumn
        Label={Label}
        disable={
          ('disableSort' in field && Boolean(field.disableSort)) ||
          fieldIsPresentationalOnly(field) ||
          undefined
        }
        // eslint-disable-next-line react/jsx-no-duplicate-props
        label={'label' in field.fieldComponentProps ? field.fieldComponentProps.label : undefined}
        name={'name' in field ? field.name : undefined}
      />
    )

    if (field) {
      const column: Column = {
        name,
        Label,
        accessor: name,
        active,
        cellProps: {
          ...cellProps?.[index],
          link: isFirstActiveColumn,
        },
        components: {
          Cell,
          Heading,
        },
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
