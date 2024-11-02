import type {
  ClientCollectionConfig,
  ClientField,
  DefaultCellComponentProps,
  Field,
  ImportMap,
  PaginatedDocs,
  SanitizedCollectionConfig,
  StaticLabel,
} from 'payload'

import { fieldIsPresentationalOnly } from 'payload/shared'
import React from 'react'

import type { ColumnPreferences } from '../../providers/ListQuery/index.js'
import type { SortColumnProps } from '../SortColumn/index.js'
import type { Column } from '../Table/index.js'

import { flattenFieldMap } from '../../utilities/flattenFieldMap.js'
import { RenderServerComponent } from '../RenderServerComponent/index.js'
import { SelectAll } from '../SelectAll/index.js'
import { SelectRow } from '../SelectRow/index.js'
import { SortColumn } from '../SortColumn/index.js'
import { RenderDefaultCell } from './RenderDefaultCell/index.js'

type Args = {
  beforeRows?: Column[]
  clientFields: ClientField[]
  collectionConfig: ClientCollectionConfig
  columnPreferences: ColumnPreferences
  columns?: ColumnPreferences
  docs: PaginatedDocs['docs']
  drawerSlug: string
  enableRowSelections: boolean
  enableRowTypes?: boolean
  fields: Field[]
  importMap: ImportMap
  sortColumnProps?: Partial<SortColumnProps>
  useAsTitle: SanitizedCollectionConfig['admin']['useAsTitle']
}

export const buildColumnState = (args: Args): Column[] => {
  const {
    beforeRows,
    clientFields,
    collectionConfig,
    columnPreferences,
    columns,
    docs,
    drawerSlug,
    enableRowSelections,
    fields,
    importMap,
    sortColumnProps,
    useAsTitle,
  } = args

  // clientFields contains the fake `id` column
  let sortedFieldMap = flattenFieldMap(clientFields)
  let _sortedFieldMap = flattenFieldMap(fields) // TODO: think of a way to avoid this additional flatten

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

  const sortFieldMap = (fieldMap, sortTo) =>
    fieldMap?.sort((a, b) => {
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

  if (sortTo) {
    // sort the fields to the order of `defaultColumns` or `columnPreferences`
    sortedFieldMap = sortFieldMap(sortedFieldMap, sortTo)
    _sortedFieldMap = sortFieldMap(_sortedFieldMap, sortTo) // TODO: think of a way to avoid this additional sort
  }

  const activeColumnsIndices = []

  const sorted: Column[] = sortedFieldMap?.reduce((acc, field, index) => {
    const _field = _sortedFieldMap.find(
      (f) => 'name' in field && 'name' in f && f.name === field.name,
    )

    const columnPreference = columnPreferences?.find(
      (preference) => field && 'name' in field && preference.accessor === field.name,
    )

    let active = false

    if (columnPreference) {
      active = columnPreference.active
    } else if (columns && Array.isArray(columns) && columns.length > 0) {
      active = columns.find(
        (column) => field && 'name' in field && column.accessor === field.name,
      )?.active
    } else if (activeColumnsIndices.length < 4) {
      active = true
    }

    if (active && !activeColumnsIndices.includes(index)) {
      activeColumnsIndices.push(index)
    }

    const CustomLabelToRender =
      _field &&
      'admin' in _field &&
      'components' in _field.admin &&
      'Label' in _field.admin.components &&
      _field.admin.components.Label !== undefined // let it return `null`
        ? _field.admin.components.Label
        : undefined

    const CustomLabel = CustomLabelToRender ? (
      <RenderServerComponent Component={CustomLabelToRender} importMap={importMap} />
    ) : undefined

    const fieldAffectsDataSubFields =
      field &&
      field.type &&
      (field.type === 'array' || field.type === 'group' || field.type === 'blocks')

    const Heading = (
      <SortColumn
        disable={fieldAffectsDataSubFields || fieldIsPresentationalOnly(field) || undefined}
        Label={CustomLabel}
        label={field && 'label' in field ? (field.label as StaticLabel) : undefined}
        name={'name' in field ? field.name : undefined}
        {...(sortColumnProps || {})}
      />
    )

    const baseCellClientProps: DefaultCellComponentProps = {
      cellData: undefined,
      customCellContext: {
        collectionSlug: collectionConfig.slug,
        uploadConfig: collectionConfig?.upload,
      },
      field,
      rowData: undefined,
    }

    const serverProps = {
      field: _field,
    }

    const column: Column = {
      accessor: 'name' in field ? field.name : undefined,
      active,
      CustomLabel,
      field,
      Heading,
      renderedCells: active
        ? docs.map((doc, i) => {
            const isLinkedColumn = index === activeColumnsIndices[0]

            const cellClientProps: DefaultCellComponentProps = {
              ...baseCellClientProps,
              cellData: 'name' in field ? doc[field.name] : undefined,
              link: isLinkedColumn,
              rowData: doc,
            }

            const CustomCell =
              _field?.admin && 'components' in _field.admin && _field.admin.components?.Cell ? (
                <RenderServerComponent
                  clientProps={cellClientProps}
                  Component={
                    _field?.admin && 'components' in _field.admin && _field.admin.components?.Cell
                  }
                  importMap={importMap}
                  key={i}
                  serverProps={serverProps}
                />
              ) : undefined

            return (
              CustomCell ?? (
                <RenderDefaultCell
                  addOnClick={Boolean(drawerSlug)}
                  clientProps={cellClientProps}
                  enableRowSelections={enableRowSelections}
                  index={index}
                  isLinkedColumn={isLinkedColumn}
                  key={i}
                />
              )
            )
          })
        : [],
    }

    acc.push(column)

    return acc
  }, [])

  if (enableRowSelections) {
    sorted?.unshift({
      accessor: '_select',
      active: true,
      field: null,
      Heading: <SelectAll />,
      renderedCells: docs.map((_, i) => <SelectRow key={i} rowData={docs[i]} />),
    })
  }

  if (beforeRows) {
    sorted.unshift(...beforeRows)
  }

  return sorted
}
