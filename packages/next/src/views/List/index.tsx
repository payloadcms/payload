import { DefaultListView, HydrateAuthProvider, ListQueryProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { renderFilters, renderTable, upsertPreferences } from '@payloadcms/ui/rsc'
import { mergeListSearchAndWhere } from '@payloadcms/ui/shared'
import { notFound } from 'next/navigation.js'
import {
  type AdminViewServerProps,
  type ColumnPreference,
  type ListPreferences,
  type ListQuery,
  type ListViewClientProps,
  type ListViewServerPropsOnly,
  type Where,
} from 'payload'
import { formatAdminURL, isNumber, transformColumnsToPreferences } from 'payload/shared'
import React, { Fragment } from 'react'

import { renderListViewSlots } from './renderListViewSlots.js'
import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'

export { generateListMetadata } from './meta.js'

type RenderListViewArgs = {
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  drawerSlug?: string
  enableRowSelections: boolean
  overrideEntityVisibility?: boolean
  query: ListQuery
} & AdminViewServerProps

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
    drawerSlug,
    enableRowSelections,
    initPageResult,
    overrideEntityVisibility,
    params,
    query: queryFromArgs,
    searchParams,
  } = args

  const {
    collectionConfig,
    collectionConfig: { slug: collectionSlug },
    locale: fullLocale,
    permissions,
    req,
    req: {
      i18n,
      locale,
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

  const query = queryFromArgs || queryFromReq

  const columns: ColumnPreference[] = transformColumnsToPreferences(
    query?.columns as ColumnPreference[] | string,
  )

  /**
   * @todo: find a pattern to avoid setting preferences on hard navigation, i.e. direct links, page refresh, etc.
   * This will ensure that prefs are only updated when explicitly set by the user
   * This could potentially be done by injecting a `sessionID` into the params and comparing it against a session cookie
   */
  const listPreferences = await upsertPreferences<ListPreferences>({
    key: `${collectionSlug}-list`,
    req,
    value: {
      columns,
      limit: isNumber(query?.limit) ? Number(query.limit) : undefined,
      sort: query?.sort as string,
    },
  })

  const {
    routes: { admin: adminRoute },
  } = config

  if (collectionConfig) {
    if (!visibleEntities.collections.includes(collectionSlug) && !overrideEntityVisibility) {
      throw new Error('not-found')
    }

    const page = isNumber(query?.page) ? Number(query.page) : 0

    const limit = listPreferences?.limit || collectionConfig.admin.pagination.defaultLimit

    const sort =
      listPreferences?.sort ||
      (typeof collectionConfig.defaultSort === 'string' ? collectionConfig.defaultSort : undefined)

    let where = mergeListSearchAndWhere({
      collectionConfig,
      search: typeof query?.search === 'string' ? query.search : undefined,
      where: (query?.where as Where) || undefined,
    })

    if (typeof collectionConfig.admin?.baseListFilter === 'function') {
      const baseListFilter = await collectionConfig.admin.baseListFilter({
        limit,
        page,
        req,
        sort,
      })

      if (baseListFilter) {
        where = {
          and: [where, baseListFilter].filter(Boolean),
        }
      }
    }

    const data = await payload.find({
      collection: collectionSlug,
      depth: 0,
      draft: true,
      fallbackLocale: false,
      includeLockStatus: true,
      limit,
      locale,
      overrideAccess: false,
      page,
      req,
      sort,
      user,
      where: where || {},
    })

    const clientCollectionConfig = clientConfig.collections.find((c) => c.slug === collectionSlug)

    const { columnState, Table } = renderTable({
      clientCollectionConfig,
      collectionConfig,
      columnPreferences: listPreferences?.columns,
      columns,
      customCellProps,
      docs: data.docs,
      drawerSlug,
      enableRowSelections,
      i18n: req.i18n,
      payload,
      useAsTitle: collectionConfig.admin.useAsTitle,
    })

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

    const serverProps: ListViewServerPropsOnly = {
      collectionConfig,
      data,
      i18n,
      limit,
      listPreferences,
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
        newDocumentURL,
      },
      collectionConfig,
      description: staticDescription,
      payload,
      serverProps,
    })

    const isInDrawer = Boolean(drawerSlug)

    return {
      List: (
        <Fragment>
          <HydrateAuthProvider permissions={permissions} />
          <ListQueryProvider
            columns={transformColumnsToPreferences(columnState)}
            data={data}
            defaultLimit={limit}
            defaultSort={sort}
            listPreferences={listPreferences}
            modifySearchParams={!isInDrawer}
          >
            {RenderServerComponent({
              clientProps: {
                ...listViewSlots,
                collectionSlug,
                columnState,
                disableBulkDelete,
                disableBulkEdit,
                enableRowSelections,
                hasCreatePermission,
                listPreferences,
                newDocumentURL,
                renderedFilters,
                resolvedFilterOptions,
                Table,
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
