import type { AdminViewServerProps, BuildCollectionFolderViewResult, ListQuery } from 'payload'

import { DefaultCollectionTreeView, HydrateAuthProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { getTreeViewResultsComponentAndData, upsertPreferences } from '@payloadcms/ui/rsc'

export type BuildCollectionTreeViewStateArgs = {
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  enableRowSelections: boolean
  isInDrawer?: boolean
  overrideEntityVisibility?: boolean
  query: ListQuery
} & AdminViewServerProps

export const buildCollectionTreeView = async (
  args: BuildCollectionTreeViewStateArgs,
): Promise<BuildCollectionFolderViewResult> => {
  const {
    disableBulkDelete,
    disableBulkEdit,
    enableRowSelections,
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

  if (!config.treeView) {
    throw new Error('not-found')
  }

  if (!permissions?.collections?.[collectionSlug]?.read) {
    throw new Error('not-found')
  }

  if (collectionConfig) {
    if (!visibleEntities.collections.includes(collectionSlug) && !overrideEntityVisibility) {
      throw new Error('not-found')
    }

    const query = queryFromArgs || queryFromReq

    const {
      routes: { admin: adminRoute },
    } = config

    const { Component, documents } = await getTreeViewResultsComponentAndData({
      collectionSlug,
      // TODO: remove and get from prefs
      expandedItemIDs: [
        '68e55080d18048a90c795f6b',
        '68e5508ed18048a90c795f7f',
        '68e547aed18048a90c795d25',
        '68e550bfd18048a90c795fd3',
        '68e023f7bdb81b341429f726',
      ],
      req: initPageResult.req,
      sort: 'titlePath',
      // sort: sortPreference,
      // search,
    })

    const serverProps: any = {
      collectionConfig,
      i18n,
      locale: fullLocale,
      params,
      payload,
      permissions,
      searchParams,
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
              collectionSlug,
              disableBulkDelete,
              disableBulkEdit,
              documents,
              enableRowSelections,
              // folderFieldName: config.folders.fieldName,
              Component,
              search,
              // sort: sortPreference,
            },
            // Component: collectionConfig?.admin?.components?.views?.TreeView?.Component,
            Fallback: DefaultCollectionTreeView,
            importMap: payload.importMap,
            serverProps,
          })}
        </>
      ),
    }
  }

  throw new Error('not-found')
}
