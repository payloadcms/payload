import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  CollectionConfig,
  Column,
  ColumnPreference,
  DateFieldClient,
  Field,
  ImportMap,
  ListPreferences,
  Payload,
  SanitizedCollectionConfig,
} from 'payload'

import { fieldAffectsData, fieldIsHiddenOrDisabled, flattenTopLevelFields } from 'payload/shared'
import React from 'react'

import type { BuildColumnStateArgs } from '../../providers/TableColumns/buildColumnState/index.js'

import { FolderListTable } from '../../elements/FolderView/FolderListTable/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { DateCell } from '../../elements/Table/DefaultCell/fields/Date/index.js'
import { DocumentIcon } from '../../icons/Document/index.js'
import { FolderIcon } from '../../icons/Folder/index.js'
import { filterFields } from '../../providers/TableColumns/buildColumnState/filterFields.js'
import { buildColumnState } from '../../providers/TableColumns/buildColumnState/index.js'
import { getInitialColumns } from '../../providers/TableColumns/getInitialColumns.js'
export const renderFilters = (
  fields: Field[],
  importMap: ImportMap,
): Map<string, React.ReactNode> =>
  fields.reduce(
    (acc, field) => {
      if (fieldIsHiddenOrDisabled(field)) {
        return acc
      }

      if ('name' in field && field.admin?.components?.Filter) {
        acc.set(
          field.name,
          RenderServerComponent({
            Component: field.admin.components?.Filter,
            importMap,
          }),
        )
      }

      return acc
    },
    new Map() as Map<string, React.ReactNode>,
  )

export const renderFolderTable = ({
  clientCollectionConfig,
  clientConfig,
  collectionConfig,
  collections,
  columnPreferences,
  columns: columnsFromArgs,
  customCellProps,
  docs,
  enableRowSelections,
  i18n,
  payload,
  subfolders,
  tableAppearance,
  useAsTitle,
}: {
  clientCollectionConfig?: ClientCollectionConfig
  clientConfig?: ClientConfig
  collectionConfig?: SanitizedCollectionConfig
  collections?: string[]
  columnPreferences: ListPreferences['columns']
  columns?: ListPreferences['columns']
  customCellProps?: Record<string, any>
  docs: {
    relationTo: string
    value: any
  }[]
  drawerSlug?: string
  enableRowSelections: boolean
  i18n: I18nClient
  payload: Payload
  renderRowTypes?: boolean
  subfolders: {
    relationTo: string
    value: any
  }[]
  tableAppearance?: 'condensed' | 'default'
  useAsTitle: CollectionConfig['admin']['useAsTitle']
}): {
  columnState: Column[]
  Table: React.ReactNode
} => {
  // Ensure that columns passed as args comply with the field config, i.e. `hidden`, `disableListColumn`, etc.

  let clientFields: ClientField[] = clientCollectionConfig.fields
  let serverFields: Field[] = collectionConfig.fields
  const isPolymorphic = collections

  if (isPolymorphic) {
    clientFields = []
    serverFields = []
    for (const collection of collections) {
      const clientCollectionConfig = clientConfig.collections.find(
        (each) => each.slug === collection,
      )
      for (const field of filterFields(clientCollectionConfig.fields)) {
        if (fieldAffectsData(field)) {
          if (clientFields.some((each) => fieldAffectsData(each) && each.name === field.name)) {
            continue
          }
        }

        clientFields.push(field)
      }

      const serverCollectionConfig = payload.collections[collection].config
      for (const field of filterFields(serverCollectionConfig.fields)) {
        if (fieldAffectsData(field)) {
          if (serverFields.some((each) => fieldAffectsData(each) && each.name === field.name)) {
            continue
          }
        }

        serverFields.push(field)
      }
    }
  }

  const columnPreferences2: ColumnPreference[] = columnsFromArgs
    ? columnsFromArgs?.filter((column) =>
        flattenTopLevelFields(clientFields, true)?.some(
          (field) => 'name' in field && field.name === column.accessor,
        ),
      )
    : getInitialColumns(
        isPolymorphic ? clientFields : filterFields(clientFields),
        useAsTitle,
        isPolymorphic ? [] : clientCollectionConfig?.admin?.defaultColumns,
      )

  const sharedArgs: Pick<
    BuildColumnStateArgs,
    | 'clientFields'
    | 'columnPreferences'
    | 'columns'
    | 'customCellProps'
    | 'enableRowSelections'
    | 'i18n'
    | 'payload'
    | 'serverFields'
    | 'useAsTitle'
  > = {
    clientFields,
    columnPreferences,
    columns: columnPreferences2,
    enableRowSelections,
    i18n,
    // sortColumnProps,
    customCellProps,
    payload,
    serverFields,
    useAsTitle,
  }

  const columnState = buildColumnState({
    ...sharedArgs,
    collectionSlug: undefined,
    dataType: 'polymorphic',
    docs,
    enableLinkedCell: false,
  })

  let columnsToUse = [...columnState]

  columnsToUse = columnState.map((column, columnIndex) => {
    return {
      ...column,
      renderedCells: [
        ...subfolders.map((subfolder) => {
          if (columnIndex === 0) {
            return (
              <div className="cell-with-icon" key={columnIndex}>
                <FolderIcon />
                {subfolder?.value?.name}
              </div>
            )
          } else if (column.accessor === 'createdAt' || column.accessor === 'updatedAt') {
            return (
              <DateCell
                cellData={subfolder.value[column.accessor]}
                collectionSlug={payload.config.folders.slug}
                field={column.field as DateFieldClient}
                key={columnIndex}
                rowData={subfolder.value}
              />
            )
          } else {
            return <React.Fragment key={columnIndex}>—</React.Fragment>
          }
        }),
        ...column.renderedCells.map((cell) => {
          if (columnIndex === 0) {
            return (
              <div className="cell-with-icon" key={`${columnIndex}-${column.accessor}`}>
                <DocumentIcon />
                {cell}
              </div>
            )
          }
          return cell
        }),
      ],
    }
  })

  return {
    columnState,
    // key is required since Next.js 15.2.0 to prevent React key error
    Table: <FolderListTable appearance={tableAppearance} columns={columnsToUse} key="table" />,
  }
}
