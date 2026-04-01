import type {
  AdminViewServerProps,
  BuildCollectionFolderViewResult,
  FolderListViewClientProps,
  FolderListViewServerPropsOnly,
  FolderSortKeys,
  ListQuery,
} from 'payload'

import { formatAdminURL } from 'payload/shared'
import React from 'react'

import { HydrateAuthProvider } from '../../elements/HydrateAuthProvider/index.js'
import { RenderServerComponent } from '../../elements/RenderServerComponent/index.js'
import { getFolderResultsComponentAndData } from '../../utilities/getFolderResultsComponentAndData.js'
import { upsertPreferences } from '../../utilities/upsertPreferences.js'
import { DefaultCollectionFolderView } from '../CollectionFolder/index.js'

export type BuildCollectionFolderViewStateArgs = {
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

/**
 * Builds the entire view for collection-folder views on the server.
 * Framework-agnostic version: accepts optional redirect callback instead of importing from next/navigation.
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
    redirect,
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
      const redirectURL = formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}/${config.folders.slug}`,
      })
      if (redirect) {
        redirect(redirectURL)
      }
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

    const search = query?.search as string

    return {
      View: (
        <>
          <HydrateAuthProvider permissions={permissions} />
          {RenderServerComponent({
            clientProps: {
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
