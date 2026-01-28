import type {
  AdminViewServerProps,
  BuildCollectionFolderViewResult,
  FolderListViewClientProps,
  FolderListViewServerPropsOnly,
  FolderSortKeys,
  ListQuery,
} from 'payload'

import { DefaultCollectionFolderView, HydrateAuthProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { getFolderResultsComponentAndData, upsertPreferences } from '@payloadcms/ui/rsc'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import React from 'react'

// import { renderFolderViewSlots } from './renderFolderViewSlots.js'

export type BuildCollectionFolderViewStateArgs = {
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
): Promise<BuildCollectionFolderViewResult> => {
  const {
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
  } = args

  const {
    collectionConfig,
    collectionConfig: { slug: collectionSlug },
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

  if (!config.folders) {
    throw new Error('not-found')
  }

  if (
    !permissions?.collections?.[collectionSlug]?.read ||
    !permissions?.collections?.[config.folders.slug].read
  ) {
    throw new Error('not-found')
  }

  if (collectionConfig) {
    if (
      (!visibleEntities.collections.includes(collectionSlug) && !overrideEntityVisibility) ||
      !config.folders
    ) {
      throw new Error('not-found')
    }

    const query = queryFromArgs || queryFromReq

    /**
     * @todo: find a pattern to avoid setting preferences on hard navigation, i.e. direct links, page refresh, etc.
     * This will ensure that prefs are only updated when explicitly set by the user
     * This could potentially be done by injecting a `sessionID` into the params and comparing it against a session cookie
     */
    const collectionFolderPreferences = await upsertPreferences<{
      sort?: FolderSortKeys
      viewPreference?: 'grid' | 'list'
    }>({
      key: `${collectionSlug}-collection-folder`,
      req: initPageResult.req,
      value: {
        sort: query?.sort as FolderSortKeys,
      },
    })

    const sortPreference: FolderSortKeys = collectionFolderPreferences?.sort || 'name'
    const viewPreference = collectionFolderPreferences?.viewPreference || 'grid'

    const {
      routes: { admin: adminRoute },
    } = config

    const {
      breadcrumbs,
      documents,
      folderAssignedCollections,
      FolderResultsComponent,
      subfolders,
    } = await getFolderResultsComponentAndData({
      browseByFolder: false,
      collectionsToDisplay: [config.folders.slug, collectionSlug],
      displayAs: viewPreference,
      folderAssignedCollections: [collectionSlug],
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
          path: `/collections/${collectionSlug}/${config.folders.slug}`,
        }),
      )
    }

    const serverProps: FolderListViewServerPropsOnly = {
      collectionConfig,
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

    // We could support slots in the folder view in the future
    // const folderViewSlots = renderFolderViewSlots({
    //   clientProps: {
    //     collectionSlug,
    //     hasCreatePermission,
    //     newDocumentURL,
    //   },
    //   collectionConfig,
    //   description: typeof collectionConfig.admin.description === 'function'
    //   ? collectionConfig.admin.description({ t: i18n.t })
    //   : collectionConfig.admin.description,
    //   payload,
    //   serverProps,
    // })

    const search = query?.search as string

    return {
      View: (
        <>
          <HydrateAuthProvider permissions={permissions} />
          {RenderServerComponent({
            clientProps: {
              // ...folderViewSlots,
              allCollectionFolderSlugs: [config.folders.slug, collectionSlug],
              allowCreateCollectionSlugs: [
                permissions?.collections?.[config.folders.slug]?.create
                  ? config.folders.slug
                  : null,
                resolvedFolderID && permissions?.collections?.[collectionSlug]?.create
                  ? collectionSlug
                  : null,
              ].filter(Boolean),
              baseFolderPath: `/collections/${collectionSlug}/${config.folders.slug}`,
              breadcrumbs,
              collectionSlug,
              disableBulkDelete,
              disableBulkEdit,
              documents,
              enableRowSelections,
              folderAssignedCollections,
              folderFieldName: config.folders.fieldName,
              folderID: resolvedFolderID || null,
              FolderResultsComponent,
              search,
              sort: sortPreference,
              subfolders,
              viewPreference,
            } satisfies FolderListViewClientProps,
            // Component: collectionConfig?.admin?.components?.views?.Folders?.Component,
            Fallback: DefaultCollectionFolderView,
            importMap: payload.importMap,
            serverProps,
          })}
        </>
      ),
    }
  }

  throw new Error('not-found')
}
