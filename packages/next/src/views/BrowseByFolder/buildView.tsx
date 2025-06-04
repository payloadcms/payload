import type {
  AdminViewServerProps,
  BuildCollectionFolderViewResult,
  FolderListViewServerPropsOnly,
  ListQuery,
  Where,
} from 'payload'

import { DefaultBrowseByFolderView, FolderProvider, HydrateAuthProvider } from '@payloadcms/ui'
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
import { formatAdminURL } from '@payloadcms/ui/shared'
import { redirect } from 'next/navigation.js'
import { getFolderData } from 'payload'
import { buildFolderWhereConstraints } from 'payload/shared'
import React from 'react'

import { getPreferences } from '../../utilities/getPreferences.js'

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

  const browseByFolderSlugs = browseByFolderSlugsFromArgs.filter(
    (collectionSlug) =>
      permissions?.collections?.[collectionSlug]?.read &&
      visibleEntities.collections.includes(collectionSlug),
  )

  if (config.folders === false || config.folders.browseByFolder === false) {
    throw new Error('not-found')
  }

  const query = queryFromArgs || queryFromReq
  const selectedCollectionSlugs: string[] =
    Array.isArray(query?.relationTo) && query.relationTo.length
      ? query.relationTo.filter(
          (slug) =>
            browseByFolderSlugs.includes(slug) || (config.folders && slug === config.folders.slug),
        )
      : [...browseByFolderSlugs, config.folders.slug]

  const {
    routes: { admin: adminRoute },
  } = config

  const folderCollectionConfig = payload.collections[config.folders.slug].config

  const browseByFolderPreferences = await getPreferences<{ viewPreference: string }>(
    'browse-by-folder',
    payload,
    user.id,
    user.collection,
  )

  let documentWhere: undefined | Where = undefined
  let folderWhere: undefined | Where = undefined
  // if folderID, dont make a documentWhere since it only queries root folders
  for (const collectionSlug of selectedCollectionSlugs) {
    if (collectionSlug === config.folders.slug) {
      const folderCollectionConstraints = await buildFolderWhereConstraints({
        collectionConfig: folderCollectionConfig,
        folderID,
        localeCode: fullLocale?.code,
        req: initPageResult.req,
        search: typeof query?.search === 'string' ? query.search : undefined,
      })

      if (folderCollectionConstraints) {
        folderWhere = folderCollectionConstraints
      }
    } else if (folderID) {
      if (!documentWhere) {
        documentWhere = {
          or: [],
        }
      }

      const collectionConfig = payload.collections[collectionSlug].config
      if (collectionConfig.folders && collectionConfig.folders.browseByFolder === true) {
        const collectionConstraints = await buildFolderWhereConstraints({
          collectionConfig,
          folderID,
          localeCode: fullLocale?.code,
          req: initPageResult.req,
          search: typeof query?.search === 'string' ? query.search : undefined,
        })

        if (collectionConstraints) {
          documentWhere.or.push(collectionConstraints)
        }
      }
    }
  }

  const { breadcrumbs, documents, subfolders } = await getFolderData({
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
  const hasCreatePermissionCollectionSlugs = folderID
    ? [config.folders.slug, ...browseByFolderSlugs]
    : [config.folders.slug]

  return {
    View: (
      <FolderProvider
        breadcrumbs={breadcrumbs}
        documents={documents}
        filteredCollectionSlugs={selectedCollectionSlugs}
        folderCollectionSlugs={browseByFolderSlugs}
        folderFieldName={config.folders.fieldName}
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
            viewPreference: browseByFolderPreferences?.value?.viewPreference,
          },
          // Component:config.folders?.components?.views?.list?.Component,
          Fallback: DefaultBrowseByFolderView,
          importMap: payload.importMap,
          serverProps,
        })}
      </FolderProvider>
    ),
  }
}
