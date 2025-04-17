import type {
  AdminViewServerProps,
  BuildCollectionFolderViewStateResult,
  ColumnPreference,
  FolderListViewServerPropsOnly,
  ListPreferences,
  ListQuery,
  ListViewClientProps,
  Where,
} from 'payload'

import { DefaultCollectionFolderView, FolderProvider, HydrateAuthProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { renderFilters, upsertPreferences } from '@payloadcms/ui/rsc'
import { formatAdminURL, mergeListSearchAndWhere } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import { getFolderData, parseDocumentID } from 'payload'
import { isNumber, transformColumnsToPreferences } from 'payload/shared'
import React from 'react'

import { renderFolderViewSlots } from './renderFolderViewSlots.js'
import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'

export type BuildCollectionFolderViewStateArgs = {
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections: boolean
  folderID?: number | string
  isInDrawer?: boolean
  overrideEntityVisibility?: boolean
  query: ListQuery
} & AdminViewServerProps

/**
 * Builds the entire view for collection-folder views on the server
 */
export const buildCollectionFolderView = async (
  args: BuildCollectionFolderViewStateArgs,
): Promise<BuildCollectionFolderViewStateResult> => {
  const {
    clientConfig,
    customCellProps,
    disableBulkDelete,
    disableBulkEdit,
    enableRowSelections,
    folderID,
    initPageResult,
    isInDrawer,
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
    const limit = 0

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

    const { breadcrumbs, documents, subfolders } = await getFolderData({
      collectionSlug,
      folderID,
      payload: initPageResult.req.payload,
      user: initPageResult.req.user,
    })

    const resolvedFolderID = breadcrumbs[breadcrumbs.length - 1]?.id

    if (
      !isInDrawer &&
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

    const search = query?.search as string

    return {
      View: (
        <FolderProvider
          breadcrumbs={breadcrumbs}
          collectionSlug={collectionSlug}
          documents={documents}
          folderID={folderID}
          search={search}
          subfolders={subfolders}
        >
          <HydrateAuthProvider permissions={permissions} />
          {RenderServerComponent({
            clientProps: {
              ...folderViewSlots,
              collectionSlug,
              disableBulkDelete,
              disableBulkEdit,
              enableRowSelections,
              hasCreatePermission,
              listPreferences,
              newDocumentURL,
              renderedFilters,
              resolvedFilterOptions,
            } satisfies ListViewClientProps,
            Component: collectionConfig?.admin?.components?.views?.list?.Component,
            Fallback: DefaultCollectionFolderView,
            importMap: payload.importMap,
            serverProps,
          })}
        </FolderProvider>
      ),
    }
  }

  throw new Error('not-found')
}
