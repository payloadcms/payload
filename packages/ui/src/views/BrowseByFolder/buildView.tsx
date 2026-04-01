import type {
  AdminViewServerProps,
  BuildCollectionFolderViewResult,
  FolderListViewClientProps,
  FolderListViewServerPropsOnly,
  FolderSortKeys,
  ListQuery,
} from 'payload'

import { formatAdminURL, PREFERENCE_KEYS } from 'payload/shared'
import React from 'react'

import { HydrateAuthProvider } from '../../elements/HydrateAuthProvider/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { getFolderResultsComponentAndData } from '../../utilities/getFolderResultsComponentAndData.js'
import { upsertPreferences } from '../../utilities/upsertPreferences.js'
import { DefaultBrowseByFolderView } from './index.js'

export type BuildFolderViewArgs = {
  customCellProps?: Record<string, unknown>
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections: boolean
  folderID?: number | string
  isInDrawer?: boolean
  overrideEntityVisibility?: boolean
  query: ListQuery
  /** Framework-specific redirect — throws framework error */
  redirect?: (url: string) => never
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
    redirect,
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

  const browseByFolderPreferences = await upsertPreferences<{
    sort?: FolderSortKeys
    viewPreference?: 'grid' | 'list'
  }>({
    key: PREFERENCE_KEYS.BROWSE_BY_FOLDER,
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
    const redirectURL = formatAdminURL({
      adminRoute,
      path: config.admin.routes.browseByFolder,
    })
    if (redirect) {
      redirect(redirectURL)
    }
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

  const allAvailableCollectionSlugs =
    folderID && Array.isArray(folderAssignedCollections) && folderAssignedCollections.length
      ? allowReadCollectionSlugs.filter((slug) => folderAssignedCollections.includes(slug))
      : allowReadCollectionSlugs

  const availableActiveCollectionFolderSlugs = collectionsToDisplay.filter((slug) => {
    if (slug === foldersSlug) {
      return permissions?.collections?.[foldersSlug]?.read
    } else {
      return !folderAssignedCollections || folderAssignedCollections.includes(slug)
    }
  })

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
          Fallback: DefaultBrowseByFolderView,
          importMap: payload.importMap,
          serverProps,
        })}
      </>
    ),
  }
}
