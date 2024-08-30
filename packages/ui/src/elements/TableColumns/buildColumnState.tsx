'use client'
import type { I18nClient } from '@payloadcms/translations'
import type {
  CellComponentProps,
  ClientField,
  SanitizedCollectionConfig,
  StaticLabel,
} from 'payload'

import React from 'react'

import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
import type { Column } from '../Table/index.js'

import { FieldLabel } from '../../fields/FieldLabel/index.js'
import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'
import { SelectAll } from '../SelectAll/index.js'
import { SelectRow } from '../SelectRow/index.js'
import { SortColumn } from '../SortColumn/index.js'
import { DefaultCell } from '../Table/DefaultCell/index.js'

type Args = {
  cellProps: Partial<CellComponentProps>[]
  columnPreferences: ColumnPreferences
  columns?: ColumnPreferences
  enableRowSelections: boolean
  fields: ClientField[]
  i18n: I18nClient
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}

export const buildColumnState = (args: Args): Column[] => {
  const { cellProps, columnPreferences, columns, enableRowSelections, fields, i18n, useAsTitle } =
    args

  let sortedFieldMap = flattenFieldMap({ fields, i18n })

  // place the `ID` field first, if it exists
  // do the same for the `useAsTitle` field with precedence over the `ID` field
  // then sort the rest of the fields based on the `defaultColumns` or `columnPreferences`
  const idFieldIndex = sortedFieldMap.findIndex((field) => 'name' in field && field.name === 'id')

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
    sortedFieldMap = sortedFieldMap.sort((a, b) => {
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

  const sorted: Column[] = sortedFieldMap.reduce((acc, field, index) => {
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

    const CustomLabelToRender =
      field &&
      'admin' in field &&
      'components' in field.admin &&
      'Label' in field.admin.components &&
      field.admin.components.Label !== undefined // let it return `null`
        ? field.admin.components.Label
        : undefined

    const label = field.labelWithPrefix
      ? field.labelWithPrefix
      : 'label' in field
        ? field.label
        : undefined

    const Label = (
      <FieldLabel
        field={field}
        Label={CustomLabelToRender}
        label={label ? (label as StaticLabel) : undefined}
        unstyled
      />
    )

    const fieldAffectsDataSubFields =
      field &&
      field.type &&
      (field.type === 'array' || field.type === 'group' || field.type === 'blocks')

    const Heading = (
      <SortColumn
        disable={fieldAffectsDataSubFields || field?._isPresentational || undefined}
        Label={Label}
        label={label ? (label as StaticLabel) : undefined}
        name={'name' in field ? field.name : undefined}
      />
    )

    if (field) {
      const column: Column = {
        accessor: 'name' in field ? field.name : undefined,
        active,
        cellProps: {
          field: {
            ...(field || ({} as ClientField)),
            ...(cellProps?.[index]?.field || ({} as ClientField)),
          } as ClientField,
          ...cellProps?.[index],
        },
        components: {
          Cell: field.admin?.components?.Cell || {
            type: 'client',
            Component: DefaultCell,
            RenderedComponent: null,
          },
          Heading,
        },
        Label,
      }

      acc.push(column)
    }

    return acc
  }, [])

  if (enableRowSelections) {
    sorted.unshift({
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
      Label: null,
    })
  }

  return sorted
}
