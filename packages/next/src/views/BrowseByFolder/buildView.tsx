import type {
  AdminViewServerProps,
  BuildCollectionFolderViewResult,
  FolderListViewClientProps,
  FolderListViewServerPropsOnly,
  FolderSortKeys,
  ListQuery,
} from 'payload'

import { DefaultBrowseByFolderView, HydrateAuthProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { getFolderResultsComponentAndData, upsertPreferences } from '@payloadcms/ui/rsc'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import React from 'react'

export type BuildFolderViewArgs = {
  customCellProps?: Record<string, any>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections: boolean
  folderID?: number | string
  isInDrawer?: boolean
  overrideEntityVisibility?: boolean
  query: ListQuery
} & AdminViewServerProps

export const buildBrowseByFolderView = async (
  args: BuildFolderViewArgs,
): Promise<BuildCollectionFolderViewResult> => {
  const {
    browseByFolderSlugs: browseByFolderSlugsFromArgs = [],
    disableBulkDelete,
    disableBulkEdit,
    enableRowSelections,
    folderID,
    initPageResult,
    isInDrawer,
    params,
    query: queryFromArgs,
    searchParams,
  } = args

  const {
    locale: fullLocale,
    permissions,
    req: {
      i18n,
      payload,
      payload: { config },
      query: queryFromReq,
      user,
    },
    visibleEntities,
  } = initPageResult

  if (config.folders === false || config.folders.browseByFolder === false) {
    throw new Error('not-found')
  }

  const browseByFolderSlugs = browseByFolderSlugsFromArgs.filter(
    (collectionSlug) =>
      permissions?.collections?.[collectionSlug]?.read &&
      visibleEntities.collections.includes(collectionSlug),
  )

  const query = queryFromArgs || queryFromReq
  const activeCollectionFolderSlugs: string[] =
    Array.isArray(query?.relationTo) && query.relationTo.length
      ? query.relationTo.filter(
          (slug) =>
            browseByFolderSlugs.includes(slug) || (config.folders && slug === config.folders.slug),
        )
      : [...browseByFolderSlugs, config.folders.slug]

  const {
    routes: { admin: adminRoute },
  } = config

  /**
   * @todo: find a pattern to avoid setting preferences on hard navigation, i.e. direct links, page refresh, etc.
   * This will ensure that prefs are only updated when explicitly set by the user
   * This could potentially be done by injecting a `sessionID` into the params and comparing it against a session cookie
   */
  const browseByFolderPreferences = await upsertPreferences<{
    sort?: FolderSortKeys
    viewPreference?: 'grid' | 'list'
  }>({
    key: 'browse-by-folder',
    req: initPageResult.req,
    value: {
      sort: query?.sort as FolderSortKeys,
    },
  })

  const sortPreference: FolderSortKeys = browseByFolderPreferences?.sort || '_folderOrDocumentTitle'
  const viewPreference = browseByFolderPreferences?.viewPreference || 'grid'

  const { breadcrumbs, documents, FolderResultsComponent, subfolders } =
    await getFolderResultsComponentAndData({
      activeCollectionSlugs: activeCollectionFolderSlugs,
      browseByFolder: false,
      displayAs: viewPreference,
      folderID,
      req: initPageResult.req,
      sort: sortPreference,
    })

  const resolvedFolderID = breadcrumbs[breadcrumbs.length - 1]?.id

  if (
    !isInDrawer &&
    ((resolvedFolderID && folderID && folderID !== resolvedFolderID) ||
      (folderID && !resolvedFolderID))
  ) {
    redirect(
      formatAdminURL({
        adminRoute,
        path: config.admin.routes.browseByFolder,
        serverURL: config.serverURL,
      }),
    )
  }

  const serverProps: Omit<FolderListViewServerPropsOnly, 'collectionConfig' | 'listPreferences'> = {
    documents,
    i18n,
    locale: fullLocale,
    params,
    payload,
    permissions,
    searchParams,
    subfolders,
    user,
  }

  // const folderViewSlots = renderFolderViewSlots({
  //   clientProps: {
  //   },
  //   description: staticDescription,
  //   payload,
  //   serverProps,
  // })

  // documents cannot be created without a parent folder in this view
  const allowCreateCollectionSlugs = resolvedFolderID
    ? [config.folders.slug, ...browseByFolderSlugs]
    : [config.folders.slug]

  return {
    View: (
      <>
        <HydrateAuthProvider permissions={permissions} />
        {RenderServerComponent({
          clientProps: {
            // ...folderViewSlots,
            activeCollectionFolderSlugs,
            allCollectionFolderSlugs: browseByFolderSlugs,
            allowCreateCollectionSlugs,
            baseFolderPath: `/browse-by-folder`,
            breadcrumbs,
            disableBulkDelete,
            disableBulkEdit,
            documents,
            enableRowSelections,
            folderFieldName: config.folders.fieldName,
            folderID: resolvedFolderID || null,
            FolderResultsComponent,
            sort: sortPreference,
            subfolders,
            viewPreference,
          } satisfies FolderListViewClientProps,
          // Component:config.folders?.components?.views?.BrowseByFolders?.Component,
          Fallback: DefaultBrowseByFolderView,
          importMap: payload.importMap,
          serverProps,
        })}
      </>
    ),
  }
}
