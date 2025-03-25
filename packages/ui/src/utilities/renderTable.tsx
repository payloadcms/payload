import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  CollectionConfig,
  ColumnPreference,
  Field,
  ImportMap,
  ListPreferences,
  PaginatedDocs,
  Payload,
  SanitizedCollectionConfig,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { fieldAffectsData, fieldIsHiddenOrDisabled, flattenTopLevelFields } from 'payload/shared'

import type { BuildColumnStateArgs } from '../elements/TableColumns/buildColumnState/temp_index.js'
// eslint-disable-next-line payload/no-imports-from-exports-dir
import type { Column } from '../exports/client/index.js'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import { buildColumnState } from '../elements/TableColumns/buildColumnState/temp_index.js'
import { filterFields } from '../elements/TableColumns/filterFields.js'
import { getInitialColumns } from '../elements/TableColumns/getInitialColumns.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { Pill, SelectAll, SelectRow, Table } from '../exports/client/index.js'

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

export const renderTable = ({
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
  renderRowTypes,
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
  docs: PaginatedDocs['docs']
  drawerSlug?: string
  enableRowSelections: boolean
  i18n: I18nClient
  payload: Payload
  renderRowTypes?: boolean
  tableAppearance?: 'condensed' | 'default'
  useAsTitle: CollectionConfig['admin']['useAsTitle']
}): {
  columnState: Column[]
  Table: React.ReactNode
} => {
  // Ensure that columns passed as args comply with the field config, i.e. `hidden`, `disableListColumn`, etc.

  let columnState: Column[]
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

  if (isPolymorphic) {
    columnState = buildColumnState({
      ...sharedArgs,
      collectionSlug: undefined,
      dataType: 'polymorphic',
      docs,
    })
  } else {
    columnState = buildColumnState({
      ...sharedArgs,
      collectionSlug: clientCollectionConfig.slug,
      dataType: 'monomorphic',
      docs,
    })
  }

  const columnsToUse = [...columnState]

  if (renderRowTypes) {
    columnsToUse.unshift({
      accessor: 'collection',
      active: true,
      field: {
        admin: {
          disabled: true,
        },
        hidden: true,
      },
      Heading: i18n.t('version:type'),
      renderedCells: docs.map((doc, i) => (
        <Pill key={i}>
          {getTranslation(
            collections
              ? payload.collections[doc.relationTo].config.labels.singular
              : clientCollectionConfig.labels.singular,
            i18n,
          )}
        </Pill>
      )),
    } as Column)
  }

  if (enableRowSelections) {
    columnsToUse.unshift({
      accessor: '_select',
      active: true,
      field: {
        admin: {
          disabled: true,
        },
        hidden: true,
      },
      Heading: <SelectAll />,
      renderedCells: docs.map((_, i) => <SelectRow key={i} rowData={docs[i]} />),
    } as Column)
  }

  return {
    columnState,
    // key is required since Next.js 15.2.0 to prevent React key error
    Table: <Table appearance={tableAppearance} columns={columnsToUse} data={docs} key="table" />,
  }
}
