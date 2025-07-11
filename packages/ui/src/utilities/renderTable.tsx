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
  PaginatedDocs,
  Payload,
  SanitizedCollectionConfig,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { fieldAffectsData, fieldIsHiddenOrDisabled, flattenTopLevelFields } from 'payload/shared'
import React, { Fragment } from 'react'

import type { BuildColumnStateArgs } from '../providers/TableColumns/buildColumnState/index.js'

import { GroupByPageControls } from '../elements/PageControls/GroupByPageControls.js'
import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import {
  OrderableTable,
  Pill,
  SelectAll,
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
  columnPreferences,
  columns: columnsFromArgs,
  customCellProps,
  data,
  enableRowSelections,
  heading,
  i18n,
  key = 'table',
  orderableFieldName,
  payload,
  renderRowTypes,
  tableAppearance,
  useAsTitle,
}: {
  clientCollectionConfig?: ClientCollectionConfig
  clientConfig?: ClientConfig
  collectionConfig?: SanitizedCollectionConfig
  collections?: string[]
  columnPreferences: CollectionPreferences['columns']
  columns?: CollectionPreferences['columns']
  customCellProps?: Record<string, unknown>
  data: PaginatedDocs
  drawerSlug?: string
  enableRowSelections: boolean
  heading?: React.ReactNode
  i18n: I18nClient
  key?: string
  orderableFieldName: string
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
  let clientFields: ClientField[] = clientCollectionConfig?.fields || []
  let serverFields: Field[] = collectionConfig?.fields || []
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
    columns,
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
      docs: data.docs,
    })
  } else {
    columnState = buildColumnState({
      ...sharedArgs,
      collectionSlug: clientCollectionConfig.slug,
      dataType: 'monomorphic',
      docs: data.docs,
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
      renderedCells: data.docs.map((doc, i) => (
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
      renderedCells: data.docs.map((_, i) => <SelectRow key={i} rowData={data.docs[i]} />),
    } as Column)
  }

  if (!orderableFieldName) {
    return {
      columnState,
      // key is required since Next.js 15.2.0 to prevent React key error
      Table: (
        <Fragment key={key}>
          <Table
            appearance={tableAppearance}
            columns={columnsToUse}
            data={data.docs}
            heading={heading}
          />
          <GroupByPageControls collectionConfig={clientCollectionConfig} data={data} />
        </Fragment>
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
    renderedCells: data.docs.map((_, i) => <SortRow key={i} />),
  } as Column)

  return {
    columnState,
    // key is required since Next.js 15.2.0 to prevent React key error
    Table: (
      <Fragment key={key}>
        <OrderableTable
          appearance={tableAppearance}
          collection={clientCollectionConfig}
          columns={columnsToUse}
          data={data.docs}
          heading={heading}
        />
        <GroupByPageControls collectionConfig={clientCollectionConfig} data={data} />
      </Fragment>
    ),
  }
}
