import type {
  AdminViewServerProps,
  BuildCollectionFolderViewResult,
  FolderListViewServerPropsOnly,
  ListQuery,
} from 'payload'

import { DefaultFolderView, FolderProvider, HydrateAuthProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import { getFolderData } from 'payload'
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

export const buildFolderView = async (
  args: BuildFolderViewArgs,
): Promise<BuildCollectionFolderViewResult> => {
  const {
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

  const allFolderCollectionSlugs = Object.keys(config?.folders?.collections || {})

  const collections = allFolderCollectionSlugs.filter(
    (collectionSlug) =>
      permissions?.collections?.[collectionSlug]?.read &&
      visibleEntities.collections.includes(collectionSlug),
  )

  if (!collections.length) {
    throw new Error('not-found')
  }

  const query = queryFromArgs || queryFromReq
  // get relationTo filter from query params
  const selectedCollectionSlugs: string[] =
    Array.isArray(query?.relationTo) && query.relationTo.length
      ? query.relationTo
      : [...allFolderCollectionSlugs, config.folders.slug]

  const {
    routes: { admin: adminRoute },
  } = config

  const { breadcrumbs, documents, subfolders } = await getFolderData({
    folderID,
    payload: initPageResult.req.payload,
    search: query?.search as string,
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
        path: config.admin.routes.folders,
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
  const hasCreatePermissionCollectionSlugs = folderID
    ? [config.folders.slug, ...allFolderCollectionSlugs]
    : [config.folders.slug]

  return {
    View: (
      <FolderProvider
        breadcrumbs={breadcrumbs}
        documents={documents}
        filteredCollectionSlugs={selectedCollectionSlugs}
        folderID={folderID}
        subfolders={subfolders}
      >
        <HydrateAuthProvider permissions={permissions} />
        {RenderServerComponent({
          clientProps: {
            // ...folderViewSlots,
            disableBulkDelete,
            disableBulkEdit,
            enableRowSelections,
            hasCreatePermissionCollectionSlugs,
            selectedCollectionSlugs,
          },
          // Component:config.folders?.components?.views?.list?.Component,
          Fallback: DefaultFolderView,
          importMap: payload.importMap,
          serverProps,
        })}
      </FolderProvider>
    ),
  }
}
