'use client'
import type { ClientField, SanitizedCollectionConfig, StaticLabel } from 'payload'

import React from 'react'

import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
import type { SortColumnProps } from '../SortColumn/index.js'
import type { Column } from '../Table/index.js'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'
import { SelectAll } from '../SelectAll/index.js'
import { SelectRow } from '../SelectRow/index.js'
import { SortColumn } from '../SortColumn/index.js'
import { DefaultCell } from '../Table/DefaultCell/index.js'

type Args = {
  beforeRows?: Column[]
  columnPreferences: ColumnPreferences
  columns?: ColumnPreferences
  enableRowSelections: boolean
  enableRowTypes?: boolean
  fields: ClientField[]
  sortColumnProps?: Partial<SortColumnProps>
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}

export const buildColumnState = (args: Args): Column[] => {
  const {
    beforeRows,
    columnPreferences,
    columns,
    enableRowSelections,
    fields,
    sortColumnProps,
    useAsTitle,
  } = args

  let sortedFieldMap = flattenFieldMap(fields)

  // place the `ID` field first, if it exists
  // do the same for the `useAsTitle` field with precedence over the `ID` field
  // then sort the rest of the fields based on the `defaultColumns` or `columnPreferences`
  const idFieldIndex = sortedFieldMap?.findIndex((field) => 'name' in field && field.name === 'id')

  if (idFieldIndex > -1) {
    const idField = sortedFieldMap.splice(idFieldIndex, 1)[0]
    sortedFieldMap.unshift(idField)
  }

  const useAsTitleFieldIndex = useAsTitle
    ? sortedFieldMap.findIndex((field) => 'name' in field && field.name === useAsTitle)
    : -1

  if (useAsTitleFieldIndex > -1) {
    const useAsTitleField = sortedFieldMap.splice(useAsTitleFieldIndex, 1)[0]
    sortedFieldMap.unshift(useAsTitleField)
  }

  const sortTo = columnPreferences || columns

  if (sortTo) {
    // sort the fields to the order of `defaultColumns` or `columnPreferences`
    sortedFieldMap = sortedFieldMap?.sort((a, b) => {
      const aIndex = sortTo.findIndex((column) => 'name' in a && column.accessor === a.name)
      const bIndex = sortTo.findIndex((column) => 'name' in b && column.accessor === b.name)
      if (aIndex === -1 && bIndex === -1) {
        return 0
      }
      if (aIndex === -1) {
        return 1
      }
      if (bIndex === -1) {
        return -1
      }
      return aIndex - bIndex
    })
  }

  const activeColumnsIndices = []

  const sorted: Column[] = sortedFieldMap?.reduce((acc, field, index) => {
    const columnPreference = columnPreferences?.find(
      (preference) => 'name' in field && preference.accessor === field.name,
    )

    let active = false

    if (columnPreference) {
      active = columnPreference.active
    } else if (columns && Array.isArray(columns) && columns.length > 0) {
      active = columns.find((column) => 'name' in field && column.accessor === field.name)?.active
    } else if (activeColumnsIndices.length < 4) {
      active = true
    }

    if (active && !activeColumnsIndices.includes(index)) {
      activeColumnsIndices.push(index)
    }

    // const CustomLabelToRender =
    //   field &&
    //   'admin' in field &&
    //   'components' in field.admin &&
    //   'Label' in field.admin.components &&
    //   field.admin.components.Label !== undefined // let it return `null`
    //     ? field.admin.components.Label
    //     : undefined

    const Label = null

    const fieldAffectsDataSubFields =
      field &&
      field.type &&
      (field.type === 'array' || field.type === 'group' || field.type === 'blocks')

    const Heading = (
      <SortColumn
        disable={fieldAffectsDataSubFields || field?._isPresentational || undefined}
        Label={Label}
        label={'label' in field ? (field.label as StaticLabel) : undefined}
        name={'name' in field ? field.name : undefined}
        {...(sortColumnProps || {})}
      />
    )

    if (field) {
      const column: Column = {
        accessor: 'name' in field ? field.name : undefined,
        active,
        cellProps: {
          field: {
            ...(field || ({} as ClientField)),
            admin: {
              ...(field.admin || {}),
              // components: {
              //   ...(field.admin?.components || {}),
              //   Cell: field.admin?.components?.Cell || {
              //     type: 'client',
              //     Component: DefaultCell,
              //     RenderedComponent: null,
              //   },
              //   Label,
              // },
            },
          } as ClientField,
        },
        Heading,
      }

      acc.push(column)
    }

    return acc
  }, [])

  if (enableRowSelections) {
    sorted?.unshift({
      accessor: '_select',
      active: true,
      cellProps: {
        field: {
          admin: {
            components: {
              Cell: {
                type: 'client',
                Component: null,
                RenderedComponent: <SelectRow />,
              },
              Label: null,
            },
          },
        } as ClientField,
      },
      Heading: <SelectAll />,
    })
  }

  if (beforeRows) {
    sorted.unshift(...beforeRows)
  }

  return sorted
}
