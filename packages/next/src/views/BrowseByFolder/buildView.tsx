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

  const foldersSlug = config.folders.slug

  /**
   * All visiible folder enabled collection slugs that the user has read permissions for.
   */
  const allowReadCollectionSlugs = browseByFolderSlugsFromArgs.filter(
    (collectionSlug) =>
      permissions?.collections?.[collectionSlug]?.read &&
      visibleEntities.collections.includes(collectionSlug),
  )

  const query =
    queryFromArgs ||
    ((queryFromReq
      ? {
          ...queryFromReq,
          relationTo:
            typeof queryFromReq?.relationTo === 'string'
              ? JSON.parse(queryFromReq.relationTo)
              : undefined,
        }
      : {}) as ListQuery)

  /**
   * If a folderID is provided and the relationTo query param exists,
   * we filter the collection slugs to only those that are allowed to be read.
   *
   * If no folderID is provided, only folders should be active and displayed (the root view).
   */
  let collectionsToDisplay: string[] = []
  if (folderID && Array.isArray(query?.relationTo)) {
    collectionsToDisplay = query.relationTo.filter(
      (slug) => allowReadCollectionSlugs.includes(slug) || slug === foldersSlug,
    )
  } else if (folderID) {
    collectionsToDisplay = [...allowReadCollectionSlugs, foldersSlug]
  } else {
    collectionsToDisplay = [foldersSlug]
  }

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

  const sortPreference: FolderSortKeys = browseByFolderPreferences?.sort || 'name'
  const viewPreference = browseByFolderPreferences?.viewPreference || 'grid'

  const { breadcrumbs, documents, folderAssignedCollections, FolderResultsComponent, subfolders } =
    await getFolderResultsComponentAndData({
      browseByFolder: true,
      collectionsToDisplay,
      displayAs: viewPreference,
      folderAssignedCollections: collectionsToDisplay.filter((slug) => slug !== foldersSlug) || [],
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

  // Filter down allCollectionFolderSlugs by the ones the current folder is assingned to
  const allAvailableCollectionSlugs =
    folderID && Array.isArray(folderAssignedCollections) && folderAssignedCollections.length
      ? allowReadCollectionSlugs.filter((slug) => folderAssignedCollections.includes(slug))
      : allowReadCollectionSlugs

  // Filter down activeCollectionFolderSlugs by the ones the current folder is assingned to
  const availableActiveCollectionFolderSlugs = collectionsToDisplay.filter((slug) => {
    if (slug === foldersSlug) {
      return permissions?.collections?.[foldersSlug]?.read
    } else {
      return !folderAssignedCollections || folderAssignedCollections.includes(slug)
    }
  })

  // Documents cannot be created without a parent folder in this view
  const allowCreateCollectionSlugs = (
    resolvedFolderID ? [foldersSlug, ...allAvailableCollectionSlugs] : [foldersSlug]
  ).filter((collectionSlug) => {
    if (collectionSlug === foldersSlug) {
      return permissions?.collections?.[foldersSlug]?.create
    }
    return (
      permissions?.collections?.[collectionSlug]?.create &&
      visibleEntities.collections.includes(collectionSlug)
    )
  })

  return {
    View: (
      <>
        <HydrateAuthProvider permissions={permissions} />
        {RenderServerComponent({
          clientProps: {
            // ...folderViewSlots,
            activeCollectionFolderSlugs: availableActiveCollectionFolderSlugs,
            allCollectionFolderSlugs: allAvailableCollectionSlugs,
            allowCreateCollectionSlugs,
            baseFolderPath: `/browse-by-folder`,
            breadcrumbs,
            disableBulkDelete,
            disableBulkEdit,
            documents,
            enableRowSelections,
            folderAssignedCollections,
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
