import type {
  AdminViewServerProps,
  BuildCollectionFolderViewResult,
  FolderListViewServerPropsOnly,
  ListQuery,
  Where,
} from 'payload'

import { DefaultCollectionFolderView, FolderProvider, HydrateAuthProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { formatAdminURL, mergeListSearchAndWhere } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import { getFolderData, parseDocumentID } from 'payload'
import React from 'react'

import { getPreferences } from '../../utilities/getPreferences.js'

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
    folderCollectionSlugs,
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

  if (!permissions?.collections?.[collectionSlug]?.read) {
    throw new Error('not-found')
  }

  if (collectionConfig) {
    const query = queryFromArgs || queryFromReq

    const collectionFolderPreferences = await getPreferences<{ viewPreference: string }>(
      `${collectionSlug}-collection-folder`,
      payload,
      user.id,
      user.collection,
    )

    const {
      routes: { admin: adminRoute },
    } = config

    if (
      (!visibleEntities.collections.includes(collectionSlug) && !overrideEntityVisibility) ||
      !folderCollectionSlugs.includes(collectionSlug)
    ) {
      throw new Error('not-found')
    }

    const whereConstraints = [
      mergeListSearchAndWhere({
        collectionConfig,
        search: typeof query?.search === 'string' ? query.search : undefined,
        where: (query?.where as Where) || undefined,
      }),
    ]

    if (folderID) {
      whereConstraints.push({
        [config.folders.fieldName]: {
          equals: parseDocumentID({ id: folderID, collectionSlug, payload }),
        },
      })
    } else {
      whereConstraints.push({
        [config.folders.fieldName]: {
          exists: false,
        },
      })
    }

    const { breadcrumbs, documents, subfolders } = await getFolderData({
      collectionSlug,
      folderID,
      payload: initPageResult.req.payload,
      search: query?.search as string,
      user: initPageResult.req.user,
    })

    const resolvedFolderID = breadcrumbs[breadcrumbs.length - 1]?.id

    if (
      !isInDrawer &&
      ((resolvedFolderID && folderID && folderID !== resolvedFolderID) ||
        (folderID && !resolvedFolderID))
    ) {
      return redirect(
        formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${config.folders.slug}`,
          serverURL: config.serverURL,
        }),
      )
    }

    const newDocumentURL = formatAdminURL({
      adminRoute,
      path: `/collections/${collectionSlug}/create`,
    })

    const hasCreatePermission = permissions?.collections?.[collectionSlug]?.create

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
        <FolderProvider
          breadcrumbs={breadcrumbs}
          collectionSlug={collectionSlug}
          documents={documents}
          folderCollectionSlugs={folderCollectionSlugs}
          folderID={folderID}
          search={search}
          subfolders={subfolders}
        >
          <HydrateAuthProvider permissions={permissions} />
          {RenderServerComponent({
            clientProps: {
              // ...folderViewSlots,
              collectionSlug,
              disableBulkDelete,
              disableBulkEdit,
              enableRowSelections,
              hasCreatePermission,
              newDocumentURL,
              viewPreference: collectionFolderPreferences?.value?.viewPreference,
            },
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
