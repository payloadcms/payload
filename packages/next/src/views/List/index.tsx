import { DefaultListView, HydrateAuthProvider, ListQueryProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { renderFilters, renderTable, upsertPreferences } from '@payloadcms/ui/rsc'
import { notFound } from 'next/navigation.js'
import {
  type AdminViewServerProps,
  type CollectionPreferences,
  type Column,
  type ColumnPreference,
  type ListQuery,
  type ListViewClientProps,
  type ListViewServerPropsOnly,
  type PaginatedDocs,
  type QueryPreset,
  type SanitizedCollectionPermission,
} from 'payload'
import {
  combineWhereConstraints,
  formatAdminURL,
  isNumber,
  mergeListSearchAndWhere,
  transformColumnsToPreferences,
  transformColumnsToSearchParams,
} from 'payload/shared'
import React, { Fragment } from 'react'

import { getDocumentPermissions } from '../Document/getDocumentPermissions.js'
import { handleGroupBy } from './handleGroupBy.js'
import { renderListViewSlots } from './renderListViewSlots.js'
import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'

type RenderListViewArgs = {
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  disableQueryPresets?: boolean
  drawerSlug?: string
  enableRowSelections: boolean
  overrideEntityVisibility?: boolean
  query: ListQuery
  redirectAfterDelete?: boolean
  redirectAfterDuplicate?: boolean
  /**
   * @experimental This prop is subject to change in future releases.
   */
  trash?: boolean
} & AdminViewServerProps

/**
 * This function is responsible for rendering
 * the list view on the server for both:
 *  - default list view
 *  - list view within drawers
 */
export const renderListView = async (
  args: RenderListViewArgs,
): Promise<{
  List: React.ReactNode
}> => {
  const {
    clientConfig,
    customCellProps,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections,
    initPageResult,
    overrideEntityVisibility,
    params,
    query: queryFromArgs,
    searchParams,
    trash,
    viewType,
  } = args

  const {
    collectionConfig,
    collectionConfig: { slug: collectionSlug },
    locale: fullLocale,
    permissions,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      query: queryFromReq,
      user,
    },
    visibleEntities,
  } = initPageResult

  if (!permissions?.collections?.[collectionSlug]?.read) {
    throw new Error('not-found')
  }

  const query: ListQuery = queryFromArgs || queryFromReq

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

  query.preset = collectionPreferences?.preset

  query.page = isNumber(query?.page) ? Number(query.page) : 0

  query.limit = collectionPreferences?.limit || collectionConfig.admin.pagination.defaultLimit

  query.sort =
    collectionPreferences?.sort ||
    (typeof collectionConfig.defaultSort === 'string' ? collectionConfig.defaultSort : undefined)

  query.groupBy = collectionPreferences?.groupBy

  query.columns = transformColumnsToSearchParams(collectionPreferences?.columns || [])

  const {
    routes: { admin: adminRoute },
  } = config

  if (collectionConfig) {
    if (!visibleEntities.collections.includes(collectionSlug) && !overrideEntityVisibility) {
      throw new Error('not-found')
    }

    let baseListFilter = undefined

    if (typeof collectionConfig.admin?.baseListFilter === 'function') {
      baseListFilter = await collectionConfig.admin.baseListFilter({
        limit: query.limit,
        page: query.page,
        req,
        sort: query.sort,
      })
    }

    let queryPreset: QueryPreset | undefined
    let queryPresetPermissions: SanitizedCollectionPermission | undefined

    let whereWithMergedSearch = mergeListSearchAndWhere({
      collectionConfig,
      search: typeof query?.search === 'string' ? query.search : undefined,
      where: combineWhereConstraints([query?.where, baseListFilter]),
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
          queryPresetPermissions = await getDocumentPermissions({
            id: queryPreset.id,
            collectionConfig: config.collections.find((c) => c.slug === 'payload-query-presets'),
            data: queryPreset,
            req,
          })?.then(({ docPermissions }) => docPermissions)
        }
      } catch (err) {
        req.payload.logger.error(`Error fetching query preset or preset permissions: ${err}`)
      }
    }

    let Table: React.ReactNode | React.ReactNode[] = null
    let columnState: Column[] = []
    let data: PaginatedDocs = {
      // no results default
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

    try {
      if (collectionConfig.admin.groupBy && query.groupBy) {
        ;({ columnState, data, Table } = await handleGroupBy({
          clientConfig,
          collectionConfig,
          collectionSlug,
          columns: collectionPreferences?.columns,
          customCellProps,
          drawerSlug,
          enableRowSelections,
          query,
          req,
          trash,
          user,
          where: whereWithMergedSearch,
        }))
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
          sort: query?.sort,
          trash,
          user,
          where: whereWithMergedSearch,
        })
        ;({ columnState, Table } = renderTable({
          clientCollectionConfig: clientConfig.collections.find((c) => c.slug === collectionSlug),
          collectionConfig,
          columns: collectionPreferences?.columns,
          customCellProps,
          data,
          drawerSlug,
          enableRowSelections,
          i18n: req.i18n,
          orderableFieldName: collectionConfig.orderable === true ? '_order' : undefined,
          payload: req.payload,
          query,
          useAsTitle: collectionConfig.admin.useAsTitle,
          viewType,
        }))
      }
    } catch (err) {
      if (err.name !== 'QueryError') {
        // QueryErrors are expected when a user filters by a field they do not have access to
        req.payload.logger.error({
          err,
          msg: `There was an error fetching the list view data for collection ${collectionSlug}`,
        })
        throw err
      }
    }

    const renderedFilters = renderFilters(collectionConfig.fields, req.payload.importMap)

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
    const hasDeletePermission = permissions?.collections?.[collectionSlug]?.delete

    // Check if there's a notFound query parameter (document ID that wasn't found)
    const notFoundDocId = typeof searchParams?.notFound === 'string' ? searchParams.notFound : null

    const serverProps: ListViewServerPropsOnly = {
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
      searchParams,
      user,
    }

    const listViewSlots = renderListViewSlots({
      clientProps: {
        collectionSlug,
        hasCreatePermission,
        hasDeletePermission,
        newDocumentURL,
      },
      collectionConfig,
      description: staticDescription,
      notFoundDocId,
      payload,
      serverProps,
    })

    const isInDrawer = Boolean(drawerSlug)

    // Needed to prevent: Only plain objects can be passed to Client Components from Server Components. Objects with toJSON methods are not supported. Convert it manually to a simple value before passing it to props.
    // Is there a way to avoid this? The `where` object is already seemingly plain, but is not bc it originates from the params.
    query.where = query?.where ? JSON.parse(JSON.stringify(query?.where || {})) : undefined

    return {
      List: (
        <Fragment>
          <HydrateAuthProvider permissions={permissions} />
          <ListQueryProvider
            collectionSlug={collectionSlug}
            data={data}
            modifySearchParams={!isInDrawer}
            orderableFieldName={collectionConfig.orderable === true ? '_order' : undefined}
            query={query}
          >
            {RenderServerComponent({
              clientProps: {
                ...listViewSlots,
                collectionSlug,
                columnState,
                disableBulkDelete,
                disableBulkEdit: collectionConfig.disableBulkEdit ?? disableBulkEdit,
                disableQueryPresets,
                enableRowSelections,
                hasCreatePermission,
                hasDeletePermission,
                listPreferences: collectionPreferences,
                newDocumentURL,
                queryPreset,
                queryPresetPermissions,
                renderedFilters,
                resolvedFilterOptions,
                Table,
                viewType,
              } satisfies ListViewClientProps,
              Component: collectionConfig?.admin?.components?.views?.list?.Component,
              Fallback: DefaultListView,
              importMap: payload.importMap,
              serverProps,
            })}
          </ListQueryProvider>
        </Fragment>
      ),
    }
  }

  throw new Error('not-found')
}

export const ListView: React.FC<RenderListViewArgs> = async (args) => {
  try {
    const { List: RenderedList } = await renderListView({ ...args, enableRowSelections: true })
    return RenderedList
  } catch (error) {
    if (error.message === 'not-found') {
      notFound()
    } else {
      console.error(error) // eslint-disable-line no-console
    }
  }
}
