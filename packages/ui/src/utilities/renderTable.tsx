import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  CollectionConfig,
  CollectionPreferences,
  Column,
  ColumnPreference,
  Field,
  ImportMap,
  ListQuery,
  PaginatedDocs,
  Payload,
  SanitizedCollectionConfig,
  ViewTypes,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { fieldAffectsData, fieldIsHiddenOrDisabled, flattenTopLevelFields } from 'payload/shared'
import React from 'react'

import type { BuildColumnStateArgs } from '../providers/TableColumns/buildColumnState/index.js'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import {
  GroupByHeader,
  GroupByPageControls,
  OrderableTable,
  Pill,
  SelectAll,
  SelectionProvider,
  SelectRow,
  SortHeader,
  SortRow,
  Table,
  // eslint-disable-next-line payload/no-imports-from-exports-dir -- these MUST reference the exports dir: https://github.com/payloadcms/payload/issues/12002#issuecomment-2791493587
} from '../exports/client/index.js'
import { filterFields } from '../providers/TableColumns/buildColumnState/filterFields.js'
import { buildColumnState } from '../providers/TableColumns/buildColumnState/index.js'
import { getInitialColumns } from '../providers/TableColumns/getInitialColumns.js'

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
  columns: columnsFromArgs,
  customCellProps,
  data,
  enableRowSelections,
  groupByFieldPath,
  groupByValue,
  heading,
  i18n,
  key = 'table',
  orderableFieldName,
  payload,
  query,
  renderRowTypes,
  tableAppearance,
  useAsTitle,
  viewType,
}: {
  clientCollectionConfig?: ClientCollectionConfig
  clientConfig?: ClientConfig
  collectionConfig?: SanitizedCollectionConfig
  collections?: string[]
  columns?: CollectionPreferences['columns']
  customCellProps?: Record<string, unknown>
  data?: PaginatedDocs | undefined
  drawerSlug?: string
  enableRowSelections: boolean
  groupByFieldPath?: string
  groupByValue?: string
  heading?: string
  i18n: I18nClient
  key?: string
  orderableFieldName: string
  payload: Payload
  query?: ListQuery
  renderRowTypes?: boolean
  tableAppearance?: 'condensed' | 'default'
  useAsTitle: CollectionConfig['admin']['useAsTitle']
  viewType?: ViewTypes
}): {
  columnState: Column[]
  Table: React.ReactNode
} => {
  // Ensure that columns passed as args comply with the field config, i.e. `hidden`, `disableListColumn`, etc.

  let columnState: Column[]
  let clientFields: ClientField[] = clientCollectionConfig?.fields || []
  let serverFields: Field[] = collectionConfig?.fields || []
  const isPolymorphic = collections

  const isGroupingBy = Boolean(collectionConfig?.admin?.groupBy && query?.groupBy)

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

  const columns: ColumnPreference[] = columnsFromArgs
    ? columnsFromArgs?.filter((column) =>
        flattenTopLevelFields(clientFields, {
          i18n,
          keepPresentationalFields: true,
          moveSubFieldsToTop: true,
        })?.some((field) => {
          const accessor =
            'accessor' in field ? field.accessor : 'name' in field ? field.name : undefined
          return accessor === column.accessor
        }),
      )
    : getInitialColumns(
        isPolymorphic ? clientFields : filterFields(clientFields),
        useAsTitle,
        isPolymorphic ? [] : clientCollectionConfig?.admin?.defaultColumns,
      )

  const sharedArgs: Pick<
    BuildColumnStateArgs,
    | 'clientFields'
    | 'columns'
    | 'customCellProps'
    | 'enableRowSelections'
    | 'i18n'
    | 'payload'
    | 'serverFields'
    | 'useAsTitle'
    | 'viewType'
  > = {
    clientFields,
    columns,
    enableRowSelections,
    i18n,
    // sortColumnProps,
    customCellProps,
    payload,
    serverFields,
    useAsTitle,
    viewType,
  }

  if (isPolymorphic) {
    columnState = buildColumnState({
      ...sharedArgs,
      collectionSlug: undefined,
      dataType: 'polymorphic',
      docs: data?.docs || [],
    })
  } else {
    columnState = buildColumnState({
      ...sharedArgs,
      collectionSlug: clientCollectionConfig.slug,
      dataType: 'monomorphic',
      docs: data?.docs || [],
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
      renderedCells: (data?.docs || []).map((doc, i) => (
        <Pill key={i} size="small">
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
      renderedCells: (data?.docs || []).map((_, i) => (
        <SelectRow key={i} rowData={data?.docs[i]} />
      )),
    } as Column)
  }

  if (isGroupingBy) {
    return {
      columnState,
      // key is required since Next.js 15.2.0 to prevent React key error
      Table: (
        <div
          className={['table-wrap', groupByValue !== undefined && `table-wrap--group-by`]
            .filter(Boolean)
            .join(' ')}
          key={key}
        >
          <SelectionProvider docs={data?.docs || []} totalDocs={data?.totalDocs || 0}>
            <GroupByHeader
              collectionConfig={clientCollectionConfig}
              groupByFieldPath={groupByFieldPath}
              groupByValue={groupByValue}
              heading={heading}
            />
            <Table appearance={tableAppearance} columns={columnsToUse} data={data?.docs || []} />
            <GroupByPageControls
              collectionConfig={clientCollectionConfig}
              data={data}
              groupByValue={groupByValue}
            />
          </SelectionProvider>
        </div>
      ),
    }
  }

  if (!orderableFieldName) {
    return {
      columnState,
      // key is required since Next.js 15.2.0 to prevent React key error
      Table: (
        <div className="table-wrap" key={key}>
          <Table appearance={tableAppearance} columns={columnsToUse} data={data?.docs || []} />
        </div>
      ),
    }
  }

  columnsToUse.unshift({
    accessor: '_dragHandle',
    active: true,
    field: {
      admin: {
        disabled: true,
      },
      hidden: true,
    },
    Heading: <SortHeader />,
    renderedCells: (data?.docs || []).map((_, i) => <SortRow key={i} />),
  } as Column)

  return {
    columnState,
    // key is required since Next.js 15.2.0 to prevent React key error
    Table: (
      <div className="table-wrap" key={key}>
        <OrderableTable
          appearance={tableAppearance}
          collection={clientCollectionConfig}
          columns={columnsToUse}
          data={data?.docs || []}
        />
      </div>
    ),
  }
}
