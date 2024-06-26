'use client'
import { type CellComponentProps, type SanitizedCollectionConfig } from 'payload'
import React from 'react'

import type { FieldMap, MappedField } from '../../providers/ComponentMap/buildComponentMap/types.js'
import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
import type { Column } from '../Table/index.js'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'
import { SelectAll } from '../SelectAll/index.js'
import { SelectRow } from '../SelectRow/index.js'
import { SortColumn } from '../SortColumn/index.js'
import { DefaultCell } from '../Table/DefaultCell/index.js'

const fieldIsPresentationalOnly = (field: MappedField): boolean => field.type === 'ui'

type Args = {
  cellProps: Partial<CellComponentProps>[]
  columnPreferences: ColumnPreferences
  columns?: ColumnPreferences
  enableRowSelections: boolean
  fieldMap: FieldMap
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}
export const buildColumnState = (args: Args): Column[] => {
  const { cellProps, columnPreferences, columns, enableRowSelections, fieldMap, useAsTitle } = args

  let sortedFieldMap = flattenFieldMap(fieldMap)

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

  const sorted = sortedFieldMap.reduce((acc, field, index) => {
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

    const Cell =
      field.CustomCell !== undefined ? (
        field.CustomCell
      ) : (
        <DefaultCell {...field.cellComponentProps} />
      )

    const CustomLabelToRender =
      field &&
      'fieldComponentProps' in field &&
      'CustomLabel' in field.fieldComponentProps &&
      field.fieldComponentProps.CustomLabel !== undefined
        ? field.fieldComponentProps.CustomLabel
        : undefined

    const Label = (
      <FieldLabel
        CustomLabel={CustomLabelToRender}
        label={field.fieldComponentProps?.label}
        {...(field.fieldComponentProps?.labelProps || {})}
        unstyled
      />
    )

    const fieldAffectsDataSubFields =
      field &&
      field.type &&
      (field.type === 'array' || field.type === 'group' || field.type === 'blocks')

    const Heading = (
      <SortColumn
        Label={Label}
        disable={fieldAffectsDataSubFields || fieldIsPresentationalOnly(field) || undefined}
        // eslint-disable-next-line react/jsx-no-duplicate-props
        label={
          'fieldComponentProps' in field && 'label' in field.fieldComponentProps
            ? field.fieldComponentProps.label
            : undefined
        }
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
          disableListColumn: field.disableListColumn,
          disableListFilter: field.disableListFilter,
        },
        cellProps: {
          ...field.cellComponentProps,
          ...cellProps?.[index],
          link: isFirstActiveColumn,
          relationTo:
            field.type === 'relationship' && 'relationTo' in field.fieldComponentProps
              ? field.fieldComponentProps.relationTo
              : undefined,
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
