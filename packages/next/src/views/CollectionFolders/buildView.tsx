import type {
  AdminViewServerProps,
  BuildCollectionFolderViewResult,
  FolderListViewServerPropsOnly,
  ListQuery,
  Where,
} from 'payload'

import { DefaultCollectionFolderView, FolderProvider, HydrateAuthProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import { getFolderData } from 'payload'
import { buildFolderWhereConstraints } from 'payload/shared'
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

    const collectionFolderPreferences = await getPreferences<{
      sort?: string
      viewPreference: string
    }>(`${collectionSlug}-collection-folder`, payload, user.id, user.collection)

    const sortPreference = collectionFolderPreferences?.value.sort

    const {
      routes: { admin: adminRoute },
    } = config

    if (
      (!visibleEntities.collections.includes(collectionSlug) && !overrideEntityVisibility) ||
      !config.folders
    ) {
      throw new Error('not-found')
    }

    let folderWhere: undefined | Where
    const folderCollectionConfig = payload.collections[config.folders.slug].config
    const folderCollectionConstraints = await buildFolderWhereConstraints({
      collectionConfig: folderCollectionConfig,
      folderID,
      localeCode: fullLocale?.code,
      req: initPageResult.req,
      search: typeof query?.search === 'string' ? query.search : undefined,
      sort: sortPreference,
    })

    if (folderCollectionConstraints) {
      folderWhere = folderCollectionConstraints
    }

    let documentWhere: undefined | Where
    const collectionConstraints = await buildFolderWhereConstraints({
      collectionConfig,
      folderID,
      localeCode: fullLocale?.code,
      req: initPageResult.req,
      search: typeof query?.search === 'string' ? query.search : undefined,
      sort: sortPreference,
    })
    if (collectionConstraints) {
      documentWhere = collectionConstraints
    }

    const { breadcrumbs, documents, subfolders } = await getFolderData({
      collectionSlug,
      documentWhere,
      folderID,
      folderWhere,
      req: initPageResult.req,
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
          folderCollectionSlugs={[collectionSlug]}
          folderFieldName={config.folders.fieldName}
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
