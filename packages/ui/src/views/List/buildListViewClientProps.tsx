import type { I18nClient } from '@payloadcms/translations'
import type {
  ClientConfig,
  CollectionPreferences,
  ColumnPreference,
  ComponentRenderer,
  ImportMap,
  ListQuery,
  ListViewClientProps,
  PaginatedDocs,
  Payload,
  QueryPreset,
  ResolvedFilterOptions,
  SanitizedCollectionPermission,
  SanitizedFieldsPermissions,
  SanitizedPermissions,
  ViewTypes,
} from 'payload'

import { RenderClientComponent } from '../../elements/RenderServerComponent/clientOnly.js'
import { getColumns } from '../../utilities/getColumns.js'
import { renderFilters, renderTable } from '../../utilities/renderTable.js'
import { renderListViewSlots } from './renderListViewSlots.js'

/**
 * Serializable subset of list view data that can cross a JSON boundary
 * (e.g. TanStack Start server function → client component).
 */
export type SerializableListViewData = {
  collectionPreferences: CollectionPreferences
  collectionSlug: string
  columns: ColumnPreference[]
  customCellProps?: Record<string, any>
  data: PaginatedDocs
  description?: string
  disableBulkDelete?: boolean
  disableBulkEdit: boolean
  disableQueryPresets?: boolean
  enableRowSelections: boolean
  fieldPermissions?: SanitizedFieldsPermissions
  hasCreatePermission: boolean
  hasDeletePermission: boolean
  hasTrashPermission: boolean
  isInDrawer: boolean
  newDocumentURL: string
  notFoundDocId?: null | string
  orderableFieldName?: string
  query: ListQuery
  queryPreset?: QueryPreset
  queryPresetPermissions?: SanitizedCollectionPermission
  resolvedFilterOptions: Map<string, ResolvedFilterOptions>
  useAsTitle?: string
  viewType: ViewTypes
}

export type BuildListViewClientPropsArgs = {
  clientConfig: ClientConfig
  data: SerializableListViewData
  i18n: I18nClient
  importMap: ImportMap
  permissions?: SanitizedPermissions
  renderComponent?: ComponentRenderer
}

/**
 * Reconstruct `ListViewClientProps` (including React nodes for Table, columns, filters)
 * from serializable data using `RenderClientComponent`.
 *
 * Designed for non-RSC frameworks (e.g. TanStack Start) where data crosses a
 * JSON serialization boundary and React nodes must be rebuilt on the client.
 *
 * Custom Cell/Label/Filter components defined via server field config are not
 * rendered here (they require the full server Field config). Default cell
 * rendering is used instead.
 */
export function buildListViewClientProps({
  clientConfig,
  data: listData,
  i18n,
  importMap,
  permissions,
  renderComponent,
}: BuildListViewClientPropsArgs): ListViewClientProps {
  const render = renderComponent || RenderClientComponent

  const clientCollectionConfig = clientConfig.collections.find(
    (c) => c.slug === listData.collectionSlug,
  )

  const payloadProxy = {
    collections: {
      [listData.collectionSlug]: {
        config: clientCollectionConfig ?? { slug: listData.collectionSlug, admin: {}, fields: [] },
      },
    },
    config: { routes: { admin: clientConfig.routes?.admin ?? '/admin' } },
    importMap,
  } as unknown as Payload

  const fieldPermissions =
    listData.fieldPermissions ?? permissions?.collections?.[listData.collectionSlug]?.fields

  const { columnState, Table } = renderTable({
    clientCollectionConfig,
    columns: listData.columns,
    customCellProps: listData.customCellProps,
    data: listData.data,
    enableRowSelections: listData.enableRowSelections,
    fieldPermissions,
    i18n,
    orderableFieldName: listData.orderableFieldName,
    payload: payloadProxy,
    query: listData.query,
    renderComponent: render,
    useAsTitle: listData.useAsTitle,
    viewType: listData.viewType,
  })

  const renderedFilters = renderFilters([], importMap, render)

  const slotClientProps = {
    collectionSlug: listData.collectionSlug,
    hasCreatePermission: listData.hasCreatePermission,
    hasDeletePermission: listData.hasDeletePermission,
    hasTrashPermission: listData.hasTrashPermission,
    newDocumentURL: listData.newDocumentURL,
  }

  const slots = renderListViewSlots({
    clientProps: slotClientProps,
    collectionConfig: { admin: { components: {} } } as any,
    description: listData.description,
    notFoundDocId: listData.notFoundDocId,
    payload: payloadProxy,
    renderComponent: render,
    serverProps: { i18n } as any,
  })

  return {
    ...slots,
    collectionSlug: listData.collectionSlug,
    columnState,
    disableBulkDelete: listData.disableBulkDelete,
    disableBulkEdit: listData.disableBulkEdit,
    disableQueryPresets: listData.disableQueryPresets,
    enableRowSelections: listData.enableRowSelections,
    hasCreatePermission: listData.hasCreatePermission,
    hasDeletePermission: listData.hasDeletePermission,
    hasTrashPermission: listData.hasTrashPermission,
    listPreferences: listData.collectionPreferences,
    newDocumentURL: listData.newDocumentURL,
    queryPreset: listData.queryPreset,
    queryPresetPermissions: listData.queryPresetPermissions,
    renderedFilters,
    resolvedFilterOptions: listData.resolvedFilterOptions,
    Table,
    viewType: listData.viewType,
  }
}
