import type {
  AdminViewServerProps,
  ListPreferences,
  ListQuery,
  ListViewClientProps,
  ListViewServerPropsOnly,
  Where,
} from 'payload'

import { DefaultCollectionFolderView, HydrateAuthProvider, ListQueryProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { renderFilters, renderTable, upsertPreferences } from '@payloadcms/ui/rsc'
import { formatAdminURL, mergeListSearchAndWhere } from '@payloadcms/ui/shared'
import { notFound } from 'next/navigation.js'
import { parseDocumentID } from 'payload'
import { combineWhereConstraints, formatFilesize, isNumber } from 'payload/shared'
import React, { Fragment } from 'react'

import { renderFolderViewSlots } from './renderFolderViewSlots.js'
import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'

export { generateFolderMetadata as generateListMetadata } from './meta.js'

type RenderListViewArgs = {
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  drawerSlug?: string
  enableRowSelections: boolean
  folderID?: number | string
  overrideEntityVisibility?: boolean
  query: ListQuery
} & AdminViewServerProps

export const renderFolderView = async (
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
    folderID,
    initPageResult,
    overrideEntityVisibility,
    params,
    query: queryFromArgs,
    searchParams,
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

  const listPreferences = await upsertPreferences<ListPreferences>({
    key: `${collectionSlug}-list`,
    req,
    value: {
      limit: isNumber(query?.limit) ? Number(query.limit) : undefined,
      sort: query?.sort as string,
    },
  })

  const {
    routes: { admin: adminRoute },
  } = config

  if (collectionConfig) {
    if (
      (!visibleEntities.collections.includes(collectionSlug) && !overrideEntityVisibility) ||
      !Object.keys(config.folders.collections).includes(collectionSlug)
    ) {
      throw new Error('not-found')
    }

    const page = isNumber(query?.page) ? Number(query.page) : 0

    const limit = listPreferences?.limit || collectionConfig.admin.pagination.defaultLimit

    const sort =
      listPreferences?.sort ||
      (typeof collectionConfig.defaultSort === 'string' ? collectionConfig.defaultSort : undefined)

    const whereConstraints = [
      mergeListSearchAndWhere({
        collectionConfig,
        search: typeof query?.search === 'string' ? query.search : undefined,
        where: (query?.where as Where) || undefined,
      }),
      {
        _parentFolder: {
          exists: true,
        },
      },
    ]

    if (typeof collectionConfig.admin?.baseListFilter === 'function') {
      const baseListFilter = await collectionConfig.admin.baseListFilter({
        limit,
        page,
        req,
        sort,
      })

      if (baseListFilter) {
        whereConstraints.push(baseListFilter)
      }
    }

    if (folderID) {
      whereConstraints.push({
        _parentFolder: {
          equals: parseDocumentID({ id: folderID, collectionSlug, payload }),
        },
      })
    }

    const where = combineWhereConstraints(whereConstraints)

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

    if (clientCollectionConfig.upload) {
      data.docs = data.docs.map((doc) => ({
        ...doc,
        filesize: formatFilesize(doc.filesize),
      }))
    }

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

    const folderViewSlots = renderFolderViewSlots({
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
            data={data}
            defaultLimit={limit}
            defaultSort={sort}
            modifySearchParams={!isInDrawer}
          >
            {RenderServerComponent({
              clientProps: {
                ...folderViewSlots,
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
              Fallback: DefaultCollectionFolderView,
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

export const CollectionFolderView: React.FC<RenderListViewArgs> = async (args) => {
  try {
    const { List: RenderedFolderView } = await renderFolderView({
      ...args,
      enableRowSelections: true,
    })
    return RenderedFolderView
  } catch (error) {
    if (error.message === 'not-found') {
      notFound()
    } else {
      console.error(error) // eslint-disable-line no-console
    }
  }
}
