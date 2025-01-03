import type {
  ListComponentClientProps,
  ListComponentServerProps,
  ListPreferences,
  ListViewClientProps,
} from '@payloadcms/ui'
import type { AdminViewProps, ListQuery, Where } from 'payload'

import { DefaultListView, HydrateAuthProvider, ListQueryProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { renderFilters, renderTable } from '@payloadcms/ui/rsc'
import { formatAdminURL, mergeListSearchAndWhere } from '@payloadcms/ui/shared'
import { notFound } from 'next/navigation.js'
import { isNumber } from 'payload/shared'
import React, { Fragment } from 'react'

import { renderListViewSlots } from './renderListViewSlots.js'

export { generateListMetadata } from './meta.js'

type ListViewArgs = {
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections: boolean
  overrideEntityVisibility?: boolean
  query: ListQuery
} & AdminViewProps

export const renderListView = async (
  args: ListViewArgs,
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
    collectionConfig: {
      slug: collectionSlug,
      admin: { useAsTitle },
      defaultSort,
      fields,
    },
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

  let listPreferences: ListPreferences
  const preferenceKey = `${collectionSlug}-list`

  try {
    listPreferences = (await payload
      .find({
        collection: 'payload-preferences',
        depth: 0,
        limit: 1,
        req,
        user,
        where: {
          and: [
            {
              key: {
                equals: preferenceKey,
              },
            },
            {
              'user.relationTo': {
                equals: user.collection,
              },
            },
            {
              'user.value': {
                equals: user?.id,
              },
            },
          ],
        },
      })
      ?.then((res) => res?.docs?.[0]?.value)) as ListPreferences
  } catch (_err) {} // eslint-disable-line no-empty

  const {
    routes: { admin: adminRoute },
  } = config

  if (collectionConfig) {
    if (!visibleEntities.collections.includes(collectionSlug) && !overrideEntityVisibility) {
      throw new Error('not-found')
    }

    const page = isNumber(query?.page) ? Number(query.page) : 0

    let whereQuery = mergeListSearchAndWhere({
      collectionConfig,
      search: typeof query?.search === 'string' ? query.search : undefined,
      where: (query?.where as Where) || undefined,
    })

    const limit = isNumber(query?.limit)
      ? Number(query.limit)
      : listPreferences?.limit || collectionConfig.admin.pagination.defaultLimit

    const sort =
      query?.sort && typeof query.sort === 'string'
        ? query.sort
        : listPreferences?.sort ||
          (typeof collectionConfig.defaultSort === 'string'
            ? collectionConfig.defaultSort
            : undefined)

    if (typeof collectionConfig.admin?.baseListFilter === 'function') {
      const baseListFilter = await collectionConfig.admin.baseListFilter({
        limit,
        page,
        req,
        sort,
      })

      if (baseListFilter) {
        whereQuery = {
          and: [whereQuery, baseListFilter].filter(Boolean),
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
      where: whereQuery || {},
    })

    const clientCollectionConfig = clientConfig.collections.find((c) => c.slug === collectionSlug)

    const { columnState, Table } = renderTable({
      clientCollectionConfig,
      collectionConfig,
      columnPreferences: listPreferences?.columns,
      customCellProps,
      docs: data.docs,
      drawerSlug,
      enableRowSelections,
      i18n: req.i18n,
      payload,
      useAsTitle,
    })

    const renderedFilters = renderFilters(fields, req.payload.importMap)

    const staticDescription =
      typeof collectionConfig.admin.description === 'function'
        ? collectionConfig.admin.description({ t: i18n.t })
        : collectionConfig.admin.description

    const sharedClientProps: ListComponentClientProps = {
      collectionSlug,
      hasCreatePermission: permissions?.collections?.[collectionSlug]?.create,
      newDocumentURL: formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}/create`,
      }),
    }

    const sharedServerProps: ListComponentServerProps = {
      collectionConfig,
      i18n,
      limit,
      locale: fullLocale,
      params,
      payload,
      permissions,
      searchParams,
      user,
    }

    const listViewSlots = renderListViewSlots({
      clientProps: sharedClientProps,
      collectionConfig,
      description: staticDescription,
      payload,
      serverProps: sharedServerProps,
    })

    const clientProps: ListViewClientProps = {
      ...listViewSlots,
      ...sharedClientProps,
      columnState,
      disableBulkDelete,
      disableBulkEdit,
      enableRowSelections,
      listPreferences,
      renderedFilters,
      Table,
    }

    const isInDrawer = Boolean(drawerSlug)

    return {
      List: (
        <Fragment>
          <HydrateAuthProvider permissions={permissions} />
          <ListQueryProvider
            collectionSlug={collectionSlug}
            data={data}
            defaultLimit={limit}
            defaultSort={sort}
            modifySearchParams={!isInDrawer}
            preferenceKey={preferenceKey}
          >
            {RenderServerComponent({
              clientProps,
              Component: collectionConfig?.admin?.components?.views?.list?.Component,
              Fallback: DefaultListView,
              importMap: payload.importMap,
              serverProps: {
                ...sharedServerProps,
                data,
                listPreferences,
                listSearchableFields: collectionConfig.admin.listSearchableFields,
              },
            })}
          </ListQueryProvider>
        </Fragment>
      ),
    }
  }

  throw new Error('not-found')
}

export const ListView: React.FC<ListViewArgs> = async (args) => {
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
