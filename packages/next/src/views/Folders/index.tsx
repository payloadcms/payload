// import type {
//   AdminViewServerProps,
//   BuildCollectionFolderViewStateResult,
//   ColumnPreference,
//   FolderListViewServerPropsOnly,
//   ListPreferences,
//   ListQuery,
//   ListViewClientProps,
//   Where,
// } from 'payload'

// import {
//   DefaultCollectionFolderView,
//   FolderProvider,
//   HydrateAuthProvider,
//   ListQueryProvider,
// } from '@payloadcms/ui'
// import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent'
// import {
//   buildCollectionFolderListState,
//   renderFilters,
//   upsertPreferences,
// } from '@payloadcms/ui/rsc'
// import { formatAdminURL, mergeListSearchAndWhere } from '@payloadcms/ui/shared'
// import { notFound, redirect } from 'next/navigation.js'
// import { getFolderData, parseDocumentID } from 'payload'
// import { combineWhereConstraints, isNumber, transformColumnsToPreferences } from 'payload/shared'
// import React from 'react'

// import { renderFolderViewSlots } from './renderFolderViewSlots.js'
// import { resolveAllFilterOptions } from './resolveAllFilterOptions.js'

// export { generateFolderMetadata as generateListMetadata } from './meta.js'

// type BuildCollectionFolderViewStateArgs = {
//   customCellProps?: Record<string, any>
//   disableBulkDelete?: boolean
//   disableBulkEdit?: boolean
//   enableRowSelections: boolean
//   folderID?: number | string
//   isInDrawer?: boolean
//   overrideEntityVisibility?: boolean
//   query: ListQuery
// } & AdminViewServerProps

// export const buildFolderViewState = async (
//   args: BuildCollectionFolderViewStateArgs,
// ): Promise<BuildCollectionFolderViewStateResult> => {
//   const {
//     clientConfig,
//     customCellProps,
//     disableBulkDelete,
//     disableBulkEdit,
//     enableRowSelections,
//     folderID,
//     initPageResult,
//     isInDrawer,
//     overrideEntityVisibility,
//     params,
//     query: queryFromArgs,
//     searchParams,
//     viewType,
//   } = args

//   const {
//     locale: fullLocale,
//     permissions,
//     req,
//     req: {
//       i18n,
//       locale,
//       payload,
//       payload: { config },
//       query: queryFromReq,
//       user,
//     },
//     visibleEntities,
//   } = initPageResult

//   const allFolderCollectionSlugs = Object.keys(config.folders.collections)

//   const collections = allFolderCollectionSlugs.filter(
//     (collectionSlug) =>
//       permissions?.collections?.[collectionSlug]?.read &&
//       visibleEntities.collections.includes(collectionSlug),
//   )

//   if (!collections.length) {
//     throw new Error('not-found')
//   }

//   const query = queryFromArgs || queryFromReq
//   // get relationTo filter from query params
//   const filteredCollectionSlugs: string[] =
//     Array.isArray(query?.relationTo) && query.relationTo.length
//       ? query.relationTo
//       : allFolderCollectionSlugs

//   const {
//     routes: { admin: adminRoute },
//   } = config

//   const limit = 0

//   const { breadcrumbs, documents, subfolders } = await getFolderData({
//     type: 'polymorphic',
//     collectionSlugs: folderID ? filteredCollectionSlugs : [],
//     docSort: initPageResult?.req.query?.sort as string,
//     folderID,
//     locale,
//     payload: initPageResult.req.payload,
//     search: query?.search as string,
//     user: initPageResult.req.user,
//   })

//   const resolvedFolderID = breadcrumbs[breadcrumbs.length - 1]?.id

//   if (
//     isInDrawer &&
//     ((resolvedFolderID && folderID && folderID !== String(resolvedFolderID)) ||
//       (folderID && !resolvedFolderID))
//   ) {
//     return redirect(
//       formatAdminURL({
//         adminRoute,
//         path: `/folders`,
//         serverURL: config.serverURL,
//       }),
//     )
//   }

//   const { columnState, Table } = buildCollectionFolderListState({
//     columnPreferences: listPreferences?.columns,
//     collections,
//     customCellProps,
//     docs: documents,
//     enableRowSelections,
//     i18n: req.i18n,
//     payload,
//     subfolders,
//     useAsTitle: '_folderSearch',
//   })

//   const resolvedFilterOptions = await resolveAllFilterOptions({
//     fields: collectionConfig.fields,
//     req,
//   })

//   const staticDescription =
//     typeof collectionConfig.admin.description === 'function'
//       ? collectionConfig.admin.description({ t: i18n.t })
//       : collectionConfig.admin.description

//   const newDocumentURL = formatAdminURL({
//     adminRoute,
//     path: `/collections/${collectionSlug}/create`,
//   })

//   const hasCreatePermission = permissions?.collections?.[collectionSlug]?.create

//   const serverProps: Omit<FolderListViewServerPropsOnly, 'collectionConfig'> = {
//     documents,
//     i18n,
//     limit,
//     listPreferences,
//     listSearchableFields: ['_folderSearch'],
//     locale: fullLocale,
//     params,
//     payload,
//     permissions,
//     searchParams,
//     subfolders,
//     user,
//   }

//   const folderViewSlots = renderFolderViewSlots({
//     clientProps: {
//       hasCreatePermission,
//       newDocumentURL,
//     },
//     description: staticDescription,
//     payload,
//     serverProps,
//   })

//   return {
//     breadcrumbs,
//     documents,
//     List: (
//       <FolderProvider
//         breadcrumbs={breadcrumbs}
//         collectionSlugs={[collectionSlug]}
//         documents={documents}
//         folderID={folderID}
//         subfolders={subfolders}
//       >
//         <HydrateAuthProvider permissions={permissions} />
//         <ListQueryProvider data={null} defaultLimit={0} modifySearchParams={!isInDrawer}>
//           {RenderServerComponent({
//             clientProps: {
//               ...folderViewSlots,
//               collectionSlug,
//               columnState,
//               disableBulkDelete,
//               disableBulkEdit,
//               enableRowSelections,
//               hasCreatePermission,
//               listPreferences,
//               newDocumentURL,
//               renderedFilters,
//               resolvedFilterOptions,
//               Table,
//             } satisfies ListViewClientProps,
//             Component: collectionConfig?.admin?.components?.views?.list?.Component,
//             Fallback: DefaultCollectionFolderView,
//             importMap: payload.importMap,
//             serverProps,
//           })}
//         </ListQueryProvider>
//       </FolderProvider>
//     ),
//     listPreferences,
//     subfolders,
//   }
// }

// export const FolderView: React.FC<BuildCollectionFolderViewStateArgs> = async (args) => {
//   try {
//     const { List: RenderedFolderView } = await buildFolderViewState(args)
//     return RenderedFolderView
//   } catch (error) {
//     if (error.message === 'not-found') {
//       notFound()
//     } else {
//       console.error(error) // eslint-disable-line no-console
//     }
//   }
// }
