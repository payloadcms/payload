import type {
  ClientCollectionConfig,
  ClientConfig,
  ClientField,
  CollectionConfig,
  Column,
  ColumnPreference,
  Field,
  ImportMap,
  ListQuery,
  PaginatedDocs,
  Payload,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedFieldsPermissions,
  ViewTypes,
} from 'payload'

import { getTranslation, type I18nClient } from '@payloadcms/translations'
import { fieldAffectsData, fieldIsHiddenOrDisabled } from 'payload/shared'
import React from 'react'

import type { BuildColumnStateArgs } from '../providers/TableColumns/buildColumnState/index.js'

import { RenderServerComponent } from '../elements/RenderServerComponent/index.js'
import {
  TableSectionContent,
  TableSectionHeader,
  TableSectionRoot,
} from '../elements/TableSection/index.js'
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
import { filterFieldsWithPermissions } from '../providers/TableColumns/buildColumnState/filterFieldsWithPermissions.js'
import { buildColumnState } from '../providers/TableColumns/buildColumnState/index.js'

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
  columns,
  customCellProps,
  data,
  enableRowSelections,
  fieldPermissions,
  groupByFieldPath,
  groupByValue,
  heading,
  i18n,
  key = 'table',
  orderableFieldName,
  payload,
  query,
  renderRowTypes,
  req,
  showHeading,
  tableAppearance,
  useAsTitle,
  viewType,
}: {
  clientCollectionConfig?: ClientCollectionConfig
  clientConfig?: ClientConfig
  collectionConfig?: SanitizedCollectionConfig
  collections?: string[]
  columns: ColumnPreference[]
  customCellProps?: Record<string, unknown>
  data?: PaginatedDocs | undefined
  drawerSlug?: string
  enableRowSelections: boolean
  fieldPermissions?: SanitizedFieldsPermissions
  groupByFieldPath?: string
  groupByValue?: string
  heading?: string
  i18n: I18nClient
  key?: string
  orderableFieldName: string
  payload: Payload
  query?: ListQuery
  renderRowTypes?: boolean
  req?: PayloadRequest
  /** Show heading without requiring full groupBy context */
  showHeading?: boolean
  tableAppearance?: 'condensed' | 'default'
  useAsTitle: CollectionConfig['admin']['useAsTitle']
  viewType?: ViewTypes
}): {
  columnState: Column[]
  Table: React.ReactNode
} => {
  // Ensure that columns passed as args comply with the field config, i.e. `hidden`, `disabled.column`, etc.

  let columnState: Column[]
  let clientFields: ClientField[] = clientCollectionConfig?.fields || []
  let serverFields: Field[] = collectionConfig?.fields || []
  const isPolymorphic = collections

  const isGroupingBy = Boolean(query?.groupBy)

  if (isPolymorphic) {
    clientFields = []
    serverFields = []

    for (const collection of collections) {
      const clientCollectionConfig = clientConfig.collections.find(
        (each) => each.slug === collection,
      )

      for (const field of filterFieldsWithPermissions({
        fieldPermissions,
        fields: clientCollectionConfig.fields,
      })) {
        if (fieldAffectsData(field)) {
          if (clientFields.some((each) => fieldAffectsData(each) && each.name === field.name)) {
            continue
          }
        }

        clientFields.push(field)
      }

      const serverCollectionConfig = payload.collections[collection].config

      for (const field of filterFieldsWithPermissions<Field>({
        fieldPermissions,
        fields: serverCollectionConfig.fields,
      })) {
        if (fieldAffectsData(field)) {
          if (serverFields.some((each) => fieldAffectsData(each) && each.name === field.name)) {
            continue
          }
        }

        serverFields.push(field)
      }
    }
  }

  const sharedArgs: Pick<
    BuildColumnStateArgs,
    | 'clientFields'
    | 'columns'
    | 'customCellProps'
    | 'enableRowSelections'
    | 'fieldPermissions'
    | 'i18n'
    | 'payload'
    | 'req'
    | 'serverFields'
    | 'useAsTitle'
    | 'viewType'
  > = {
    clientFields,
    columns,
    enableRowSelections,
    fieldPermissions,
    i18n,
    // sortColumnProps,
    customCellProps,
    payload,
    req,
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
      renderedCells: (data?.docs || []).map((row, i) => (
        <SelectRow
          key={i}
          rowData={row}
          selectRowLabel={getSelectRowLabel({ i18n, rowData: row, useAsTitle })}
        />
      )),
    } as Column)
  }

  if (isGroupingBy) {
    return {
      columnState,
      // key is required since Next.js 15.2.0 to prevent React key error
      Table: (
        <TableSectionRoot
          className={['table-wrap', groupByValue !== undefined && `table-wrap--group-by`]
            .filter(Boolean)
            .join(' ')}
          data-group-id={groupByValue}
          key={key}
        >
          <SelectionProvider docs={data?.docs || []} totalDocs={data?.totalDocs || 0}>
            <TableSectionHeader heading={heading}>
              <GroupByHeader
                collectionConfig={clientCollectionConfig}
                groupByFieldPath={groupByFieldPath}
                groupByValue={groupByValue}
                heading={heading}
              />
              <GroupByPageControls data={data} groupByValue={groupByValue} />
            </TableSectionHeader>
            <TableSectionContent>
              <Table appearance={tableAppearance} columns={columnsToUse} data={data?.docs || []} />
            </TableSectionContent>
          </SelectionProvider>
        </TableSectionRoot>
      ),
    }
  }

  if (!orderableFieldName) {
    return {
      columnState,
      // key is required since Next.js 15.2.0 to prevent React key error
      Table: (
        <TableSectionRoot className="table-wrap" key={key}>
          {showHeading && heading && (
            <TableSectionHeader>
              <h4>{heading}</h4>
            </TableSectionHeader>
          )}
          <TableSectionContent>
            <Table appearance={tableAppearance} columns={columnsToUse} data={data?.docs || []} />
          </TableSectionContent>
        </TableSectionRoot>
      ),
    }
  }

  // Insert after _select column (index 1) so order is: _select, _dragHandle, ...rest
  columnsToUse.splice(enableRowSelections ? 1 : 0, 0, {
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
      <TableSectionRoot className="table-wrap" key={key}>
        <TableSectionContent>
          <OrderableTable
            appearance={tableAppearance}
            collection={clientCollectionConfig}
            columns={columnsToUse}
            data={data?.docs || []}
          />
        </TableSectionContent>
      </TableSectionRoot>
    ),
  }
}

const getSelectRowLabel = ({
  i18n,
  rowData,
  useAsTitle,
}: {
  i18n: I18nClient
  rowData: { id: number | string } & Record<string, unknown>
  useAsTitle: CollectionConfig['admin']['useAsTitle']
}) => {
  const title = useAsTitle ? rowData[useAsTitle] : undefined
  const label =
    typeof title === 'number' || (typeof title === 'string' && title)
      ? String(title)
      : String(rowData.id)

  return i18n.t('general:selectLabel', { label })
}
