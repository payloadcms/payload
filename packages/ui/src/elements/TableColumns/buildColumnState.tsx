import type {
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

import type { ColumnPreferences } from '../../providers/ListInfo/index.js'
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
  collectionSlug: string
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
    collectionSlug,
    columnPreferences,
    columns,
    docs,
    enableRowSelections,
    // fields,
    drawerSlug,
    importMap,
    sortColumnProps,
    useAsTitle,
  } = args

  let sortedFieldMap = flattenFieldMap(clientFields)

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

    // TODO: get label from raw field config
    const CustomLabelToRender = null
    // const CustomLabelToRender =
    // field &&
    // 'admin' in field &&
    // 'components' in field.admin &&
    // 'Label' in field.admin.components &&
    // field.admin.components.Label !== undefined // let it return `null`
    //   ? field.admin.components.Label
    //   : undefined

    const CustomLabel = CustomLabelToRender ? <CustomLabelToRender field={field} /> : undefined

    const fieldAffectsDataSubFields =
      field &&
      field.type &&
      (field.type === 'array' || field.type === 'group' || field.type === 'blocks')

    const Heading = (
      <SortColumn
        disable={fieldAffectsDataSubFields || fieldIsPresentationalOnly(field) || undefined}
        Label={CustomLabel}
        label={'label' in field ? (field.label as StaticLabel) : undefined}
        name={'name' in field ? field.name : undefined}
        {...(sortColumnProps || {})}
      />
    )

    if (field) {
      const baseCellClientProps: DefaultCellComponentProps = {
        cellData: undefined,
        customCellContext: {
          collectionSlug,
        },
        field,
        rowData: undefined,
      }

      const serverProps = {
        field, // TODO get the server field
      }

      const column: Column = {
        accessor: 'name' in field ? field.name : undefined,
        active,
        field,
        Heading,
        Label: CustomLabel,
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
                field?.admin && 'components' in field.admin && field.admin.components?.Cell ? (
                  <RenderServerComponent
                    clientProps={cellClientProps}
                    Component={
                      field?.admin && 'components' in field.admin && field.admin.components?.Cell
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
    }

    return acc
  }, [])

  if (enableRowSelections) {
    sorted?.unshift({
      accessor: '_select',
      active: true,
      field: null,
      Heading: <SelectAll />,
      Label: null,
      renderedCells: docs.map((_, i) => <SelectRow key={i} rowData={docs[i]} />),
    })
  }

  if (beforeRows) {
    sorted.unshift(...beforeRows)
  }

  return sorted
}
