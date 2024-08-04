'use client'
import type { CellComponentProps, ClientFieldConfig, SanitizedCollectionConfig } from 'payload'

import React from 'react'

import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
import type { Column } from '../Table/index.js'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'
import { SelectAll } from '../SelectAll/index.js'
import { SelectRow } from '../SelectRow/index.js'
import { SortColumn } from '../SortColumn/index.js'

const fieldIsPresentationalOnly = (field: ClientFieldConfig): boolean => field.type === 'ui'

type Args = {
  cellProps: Partial<CellComponentProps>[]
  columnPreferences: ColumnPreferences
  columns?: ColumnPreferences
  enableRowSelections: boolean
  fields: ClientFieldConfig[]
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}

export const buildColumnState = (args: Args): Column[] => {
  const { cellProps, columnPreferences, columns, enableRowSelections, fields, useAsTitle } = args

  let sortedFieldMap = flattenFieldMap(fields)

  // place the `ID` field first, if it exists
  // do the same for the `useAsTitle` field with precedence over the `ID` field
  // then sort the rest of the fields based on the `defaultColumns` or `columnPreferences`
  const idFieldIndex = sortedFieldMap.findIndex((field) => field.name === 'id')

  if (idFieldIndex > -1) {
    const idField = sortedFieldMap.splice(idFieldIndex, 1)[0]
    sortedFieldMap.unshift(idField)
  }

  const useAsTitleFieldIndex = useAsTitle
    ? sortedFieldMap.findIndex((field) => field.name === useAsTitle)
    : -1

  if (useAsTitleFieldIndex > -1) {
    const useAsTitleField = sortedFieldMap.splice(useAsTitleFieldIndex, 1)[0]
    sortedFieldMap.unshift(useAsTitleField)
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

  const sorted: Column[] = sortedFieldMap.reduce((acc, field, index) => {
    const columnPreference = columnPreferences?.find(
      (preference) => 'name' in field && preference.accessor === field.name,
    )

    let active = false

    if (columnPreference) {
      active = columnPreference.active
    } else if (columns && Array.isArray(columns) && columns.length > 0) {
      active = columns.find((column) => column.accessor === field.name)?.active
    } else if (activeColumnsIndices.length < 4) {
      active = true
    }

    if (active && !activeColumnsIndices.includes(index)) {
      activeColumnsIndices.push(index)
    }

    const isFirstActiveColumn = activeColumnsIndices[0] === index

    const name = 'name' in field ? field.name : undefined

    const CustomLabelToRender =
      field &&
      'fieldComponentProps' in field &&
      'Label' in field.admin.components &&
      field.admin.components.Label !== undefined
        ? field.admin.components.Label
        : undefined

    const Label = <FieldLabel Label={CustomLabelToRender} {...field} unstyled />

    const fieldAffectsDataSubFields =
      field &&
      field.type &&
      (field.type === 'array' || field.type === 'group' || field.type === 'blocks')

    const Heading = (
      <SortColumn
        Label={Label}
        disable={fieldAffectsDataSubFields || fieldIsPresentationalOnly(field) || undefined}
        label={'label' in field ? field.label : undefined}
        name={'name' in field ? field.name : undefined}
      />
    )

    if (field) {
      const column: Column = {
        name,
        type: field.type,
        Label,
        accessor: name,
        active,
        admin: {
          disableListColumn: field.admin?.disableListColumn,
          disableListFilter: field.admin?.disableListFilter,
        },
        cellProps: {
          ...field,
          ...cellProps?.[index],
          link: isFirstActiveColumn,
          relationTo:
            field.type === 'relationship' && 'relationTo' in field ? field.relationTo : undefined,
        },
        components: {
          Cell: field.admin.components.Cell,
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
      type: null,
      Label: null,
      accessor: '_select',
      active: true,
      components: {
        Cell: {
          type: 'client',
          Component: null,
          RenderedComponent: <SelectRow />,
        },
        Heading: <SelectAll />,
      },
    })
  }

  return sorted
}
