import type {
  AdminViewServerProps,
  ColumnPreference,
  FolderListViewServerPropsOnly,
  ListPreferences,
  ListQuery,
  ListViewClientProps,
  Where,
} from 'payload'

import {
  DefaultCollectionFolderView,
  HydrateAuthProvider,
  HydrateFolderProvider,
  ListQueryProvider,
} from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { renderFilters, renderFolderTable, upsertPreferences } from '@payloadcms/ui/rsc'
import { formatAdminURL, mergeListSearchAndWhere } from '@payloadcms/ui/shared'
import { notFound, redirect } from 'next/navigation.js'
import { getFolderData, parseDocumentID } from 'payload'
import { combineWhereConstraints, isNumber, transformColumnsToPreferences } from 'payload/shared'
import React, { Fragment } from 'react'

import { renderFolderViewSlots } from './renderFolderViewSlots.js'
import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'

export { generateFolderMetadata as generateListMetadata } from './meta.js'

type RenderFolderListViewArgs = {
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
  args: RenderFolderListViewArgs,
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

  if (collectionConfig) {
    const query = queryFromArgs || queryFromReq

    const columns: ColumnPreference[] = transformColumnsToPreferences(
      query?.columns as ColumnPreference[] | string,
    )

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
    ]

    if (typeof collectionConfig.admin?.baseListFilter === 'function') {
      const baseListFilter = await collectionConfig.admin.baseListFilter({
        limit,
        locale,
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
    } else {
      whereConstraints.push({
        _parentFolder: {
          exists: false,
        },
      })
    }

    const { breadcrumbs, documents, hasMoreDocuments, subfolders } = await getFolderData({
      type: 'monomorphic',
      collectionSlugs: [collectionSlug],
      docSort: initPageResult?.req.query?.sort as string,
      docWhere: combineWhereConstraints(whereConstraints),
      folderID,
      locale,
      payload: initPageResult.req.payload,
      search: query?.search as string,
      user: initPageResult.req.user,
    })

    const resolvedFolderID = breadcrumbs[breadcrumbs.length - 1]?.id

    if (
      drawerSlug &&
      ((resolvedFolderID && folderID && folderID !== String(resolvedFolderID)) ||
        (folderID && !resolvedFolderID))
    ) {
      return redirect(
        formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/folders`,
          serverURL: config.serverURL,
        }),
      )
    }

    const clientCollectionConfig = clientConfig.collections.find((c) => c.slug === collectionSlug)

    const { columnState, Table } = renderFolderTable({
      clientCollectionConfig,
      collectionConfig,
      columnPreferences: listPreferences?.columns,
      customCellProps,
      docs: documents,
      drawerSlug,
      enableRowSelections,
      i18n: req.i18n,
      payload,
      subfolders,
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

    const serverProps: FolderListViewServerPropsOnly = {
      collectionConfig,
      documents,
      i18n,
      limit,
      listPreferences,
      listSearchableFields: collectionConfig.admin.listSearchableFields,
      locale: fullLocale,
      params,
      payload,
      permissions,
      searchParams,
      subfolders,
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

    return {
      List: (
        <Fragment>
          <HydrateAuthProvider permissions={permissions} />
          <HydrateFolderProvider
            breadcrumbs={breadcrumbs}
            documents={documents}
            folderID={folderID}
            subfolders={subfolders}
          />
          <ListQueryProvider data={null} defaultLimit={0} modifySearchParams={!drawerSlug}>
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

export const CollectionFolderView: React.FC<RenderFolderListViewArgs> = async (args) => {
  try {
    const { List: RenderedFolderView } = await renderFolderView(args)
    return RenderedFolderView
  } catch (error) {
    if (error.message === 'not-found') {
      notFound()
    } else {
      console.error(error) // eslint-disable-line no-console
    }
  }
}
