import type {
  ClientConfig,
  CollectionPreferences,
  Column,
  ColumnPreference,
  ComponentRenderer,
  ListQuery,
  ListViewClientProps,
  ListViewServerPropsOnly,
  Locale,
  PaginatedDocs,
  PayloadComponent,
  PayloadRequest,
  QueryPreset,
  ResolvedFilterOptions,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedPermissions,
  ViewTypes,
  VisibleEntities,
} from 'payload'
import type React from 'react'

import {
  appendDateTimezoneSelectFields,
  appendUploadSelectFields,
  combineWhereConstraints,
  formatAdminURL,
  isNumber,
  mergeListSearchAndWhere,
  transformColumnsToPreferences,
  transformColumnsToSearchParams,
} from 'payload/shared'

import { RenderClientComponent } from '../../elements/RenderServerComponent/clientOnly.js'
import { getColumns } from '../../utilities/getColumns.js'
import { renderFilters, renderTable } from '../../utilities/renderTable.js'
import { upsertPreferences } from '../../utilities/upsertPreferences.js'
import { getDocumentPermissions } from '../Document/getDocumentPermissions.js'
import { enrichDocsWithVersionStatus } from './enrichDocsWithVersionStatus.js'
import { handleGroupBy } from './handleGroupBy.js'
import { renderListViewSlots } from './renderListViewSlots.js'
import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'
import { transformColumnsToSelect } from './transformColumnsToSelect.js'

export type ListViewData = {
  collectionPreferences: CollectionPreferences
  collectionSlug: string
  columnState: Column[]
  data: PaginatedDocs
  disableBulkDelete?: boolean
  disableBulkEdit: boolean
  disableQueryPresets?: boolean
  enableRowSelections: boolean
  groupedData?: {
    data: PaginatedDocs
    groupByValue: string
    heading: string
  }[]
  hasCreatePermission: boolean
  hasDeletePermission: boolean
  hasTrashPermission: boolean
  isInDrawer: boolean
  listViewClientProps: ListViewClientProps
  listViewServerProps: ListViewServerPropsOnly
  newDocumentURL: string
  query: ListQuery
  queryPreset?: QueryPreset
  queryPresetPermissions?: SanitizedCollectionPermission
  renderedFilters: React.ReactNode
  resolvedFilterOptions: Map<string, ResolvedFilterOptions>
  Table: React.ReactNode | React.ReactNode[]
  View: PayloadComponent | React.ComponentType
  viewType: ViewTypes
}

export type GetListViewDataArgs = {
  clientConfig: ClientConfig
  collectionConfig: SanitizedCollectionConfig
  ComponentOverride?:
    | PayloadComponent
    | React.ComponentType<ListViewClientProps | (ListViewClientProps & ListViewServerPropsOnly)>
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  disableQueryPresets?: boolean
  drawerSlug?: string
  enableRowSelections: boolean
  locale: Locale
  overrideEntityVisibility?: boolean
  params?: { [key: string]: string | string[] | undefined }
  permissions: SanitizedPermissions
  query?: ListQuery
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
  renderComponent?: ComponentRenderer
  req: PayloadRequest
  searchParams?: { [key: string]: string | string[] | undefined }
  trash?: boolean
  viewType: ViewTypes
  visibleEntities?: VisibleEntities
}

export async function getListViewData(args: GetListViewDataArgs): Promise<ListViewData> {
  const {
    clientConfig,
    ComponentOverride,
    customCellProps,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections,
    locale: fullLocale,
    overrideEntityVisibility,
    params,
    permissions,
    query: queryFromArgs,
    renderComponent,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      query: queryFromReq,
      user,
    },
    searchParams,
    trash,
    viewType,
    visibleEntities,
  } = args

  const { collectionConfig } = args
  const collectionSlug = collectionConfig.slug

  const {
    routes: { admin: adminRoute },
  } = config

  if (
    !collectionConfig ||
    !permissions?.collections?.[collectionSlug]?.read ||
    (!visibleEntities.collections.includes(collectionSlug) && !overrideEntityVisibility)
  ) {
    throw new Error('not-found')
  }

  const render: ComponentRenderer = renderComponent || RenderClientComponent

  const query: ListQuery = queryFromArgs || queryFromReq
  const searchParamsEntries = Object.entries(searchParams || {})
  const hasExplicitColumnsParam = Object.prototype.hasOwnProperty.call(
    searchParams || {},
    'columns',
  )
  const hasExplicitGroupByParam = Object.prototype.hasOwnProperty.call(
    searchParams || {},
    'groupBy',
  )
  const hasExplicitWhereParam = searchParamsEntries.some(
    ([key]) => key === 'where' || key.startsWith('where['),
  )
  const hasExplicitPresetStateParams =
    hasExplicitColumnsParam || hasExplicitGroupByParam || hasExplicitWhereParam

  const columnsFromQuery: ColumnPreference[] = transformColumnsToPreferences(query?.columns)

  query.queryByGroup =
    query?.queryByGroup && typeof query.queryByGroup === 'string'
      ? JSON.parse(query.queryByGroup)
      : query?.queryByGroup

  const collectionPreferences = await upsertPreferences<CollectionPreferences>({
    key: `collection-${collectionSlug}`,
    req,
    value: {
      columns: columnsFromQuery,
      groupBy: query?.groupBy,
      limit: isNumber(query?.limit) ? Number(query.limit) : undefined,
      preset: query?.preset,
      sort: query?.sort as string,
    },
  })

  let queryPreset: QueryPreset | undefined
  let queryPresetPermissions: SanitizedCollectionPermission | undefined

  if (collectionPreferences?.preset) {
    try {
      queryPreset = (await payload.findByID({
        id: collectionPreferences?.preset,
        collection: 'payload-query-presets',
        depth: 0,
        overrideAccess: false,
        user,
      })) as QueryPreset

      if (queryPreset) {
        queryPresetPermissions = (
          await getDocumentPermissions({
            id: queryPreset.id,
            collectionConfig: req.payload.collections['payload-query-presets'].config,
            data: queryPreset,
            req,
          })
        )?.docPermissions
      }
    } catch (err) {
      req.payload.logger.error(`Error fetching query preset or preset permissions: ${err}`)
    }
  }

  query.preset = queryPreset?.id
  if (queryPreset?.where && !query.where) {
    query.where = queryPreset.where
  }
  query.groupBy = hasExplicitGroupByParam
    ? (query.groupBy ?? '')
    : hasExplicitPresetStateParams
      ? query.groupBy
      : (query.groupBy ?? queryPreset?.groupBy ?? collectionPreferences?.groupBy)

  const columnPreference = query.columns
    ? transformColumnsToPreferences(query.columns)
    : (queryPreset?.columns ?? collectionPreferences?.columns)
  query.columns = transformColumnsToSearchParams(columnPreference)

  query.page = isNumber(query?.page) ? Number(query.page) : 0

  query.limit = collectionPreferences?.limit || collectionConfig.admin.pagination.defaultLimit

  query.sort =
    collectionPreferences?.sort ||
    (typeof collectionConfig.defaultSort === 'string' ? collectionConfig.defaultSort : undefined)

  const baseFilterConstraint = await (
    collectionConfig.admin?.baseFilter ?? collectionConfig.admin?.baseListFilter
  )?.({
    limit: query.limit,
    page: query.page,
    req,
    sort: query.sort,
  })

  let whereWithMergedSearch = mergeListSearchAndWhere({
    collectionConfig,
    search: typeof query?.search === 'string' ? query.search : undefined,
    where: combineWhereConstraints([query?.where, baseFilterConstraint]),
  })

  if (trash === true) {
    whereWithMergedSearch = {
      and: [
        whereWithMergedSearch,
        {
          deletedAt: {
            exists: true,
          },
        },
      ],
    }
  }

  let Table: React.ReactNode | React.ReactNode[] = null
  let columnState: Column[] = []
  let groupedData: ListViewData['groupedData']
  let data: PaginatedDocs = {
    docs: [],
    hasNextPage: false,
    hasPrevPage: false,
    limit: query.limit,
    nextPage: null,
    page: 1,
    pagingCounter: 0,
    prevPage: null,
    totalDocs: 0,
    totalPages: 0,
  }

  const clientCollectionConfig = clientConfig.collections.find((c) => c.slug === collectionSlug)

  const columns = getColumns({
    clientConfig,
    collectionConfig: clientCollectionConfig,
    collectionSlug,
    columns: columnPreference,
    i18n,
    permissions,
  })

  const select = transformColumnsToSelect(columns)

  appendUploadSelectFields({
    collectionConfig,
    select,
  })

  /** Force select `_tz` siblings for any timezone-enabled date fields in select */
  appendDateTimezoneSelectFields({
    fields: collectionConfig.flattenedFields,
    select,
  })

  try {
    if (collectionConfig.admin.groupBy && query.groupBy) {
      ;({ columnState, data, groupedData, Table } = await handleGroupBy({
        clientCollectionConfig,
        clientConfig,
        collectionConfig,
        collectionSlug,
        columns,
        customCellProps,
        drawerSlug,
        enableRowSelections,
        fieldPermissions: permissions?.collections?.[collectionSlug]?.fields,
        query,
        renderComponent: render,
        req,
        select,
        trash,
        user,
        viewType,
        where: whereWithMergedSearch,
      }))

      data = await enrichDocsWithVersionStatus({
        collectionConfig,
        data,
        req,
      })
    } else {
      data = await req.payload.find({
        collection: collectionSlug,
        depth: 0,
        draft: true,
        fallbackLocale: false,
        includeLockStatus: true,
        limit: query?.limit ? Number(query.limit) : undefined,
        locale: req.locale,
        overrideAccess: false,
        page: query?.page ? Number(query.page) : undefined,
        req,
        select,
        sort: query?.sort,
        trash,
        user,
        where: whereWithMergedSearch,
      })

      data = await enrichDocsWithVersionStatus({
        collectionConfig,
        data,
        req,
      })
      ;({ columnState, Table } = renderTable({
        clientCollectionConfig,
        collectionConfig,
        columns,
        customCellProps,
        data,
        drawerSlug,
        enableRowSelections,
        fieldPermissions: permissions?.collections?.[collectionSlug]?.fields,
        i18n: req.i18n,
        orderableFieldName: collectionConfig.orderable === true ? '_order' : undefined,
        payload: req.payload,
        query,
        renderComponent: render,
        req,
        useAsTitle: collectionConfig.admin.useAsTitle,
        viewType,
      }))
    }
  } catch (err) {
    if (err.name !== 'QueryError') {
      req.payload.logger.error({
        err,
        msg: `There was an error fetching the list view data for collection ${collectionSlug}`,
      })
      throw err
    }
  }

  const renderedFilters = renderFilters(collectionConfig.fields, req.payload.importMap, render)

  const resolvedFilterOptions = await resolveAllFilterOptions({
    fields: collectionConfig.fields,
    req,
  })

  const staticDescription =
    typeof collectionConfig.admin.description === 'function'
      ? collectionConfig.admin.description({ t: i18n.t })
      : collectionConfig.admin.description

  const newDocumentURL = formatAdminURL({
    adminRoute,
    path: `/collections/${collectionSlug}/create`,
  })

  const hasCreatePermission = permissions?.collections?.[collectionSlug]?.create

  const { hasDeletePermission, hasTrashPermission } = await getDocumentPermissions({
    collectionConfig,
    data: {},
    req,
  })

  const notFoundDocId = typeof searchParams?.notFound === 'string' ? searchParams.notFound : null

  const listViewServerProps: ListViewServerPropsOnly = {
    collectionConfig,
    data,
    i18n,
    limit: query.limit,
    listPreferences: collectionPreferences,
    listSearchableFields: collectionConfig.admin.listSearchableFields,
    locale: fullLocale,
    params,
    payload,
    permissions,
    renderComponent: render,
    searchParams,
    user,
  }

  const listViewSlots = renderListViewSlots({
    clientProps: {
      collectionSlug,
      hasCreatePermission,
      hasDeletePermission,
      hasTrashPermission,
      newDocumentURL,
    },
    collectionConfig,
    description: staticDescription,
    notFoundDocId,
    payload,
    renderComponent: render,
    serverProps: listViewServerProps,
  })

  const isInDrawer = Boolean(drawerSlug)

  query.where = query?.where ? JSON.parse(JSON.stringify(query?.where || {})) : undefined

  const listViewClientProps: ListViewClientProps = {
    ...listViewSlots,
    collectionSlug,
    columnState,
    disableBulkDelete,
    disableBulkEdit: collectionConfig.disableBulkEdit ?? disableBulkEdit,
    disableQueryPresets,
    enableRowSelections,
    hasCreatePermission,
    hasDeletePermission,
    hasTrashPermission,
    listPreferences: collectionPreferences,
    newDocumentURL,
    queryPreset,
    queryPresetPermissions,
    renderedFilters,
    resolvedFilterOptions,
    Table,
    viewType,
  }

  const View = ComponentOverride ?? collectionConfig?.admin?.components?.views?.list?.Component

  return {
    collectionPreferences,
    collectionSlug,
    columnState,
    data,
    disableBulkDelete,
    disableBulkEdit: collectionConfig.disableBulkEdit ?? disableBulkEdit,
    disableQueryPresets,
    enableRowSelections,
    groupedData,
    hasCreatePermission,
    hasDeletePermission,
    hasTrashPermission,
    isInDrawer,
    listViewClientProps,
    listViewServerProps,
    newDocumentURL,
    query,
    queryPreset,
    queryPresetPermissions,
    renderedFilters,
    resolvedFilterOptions,
    Table,
    View,
    viewType,
  }
}
