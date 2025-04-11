import type {
  BuildCollectionFolderViewStateHandlerArgs,
  BuildCollectionFolderViewStateResult,
  PayloadRequest,
} from 'payload'

import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { headers as getHeaders } from 'next/headers.js'
import { getAccessResults, isEntityHidden, parseCookies } from 'payload'

import { buildCollectionFolderView } from './components/buildCollectionFolderView.js'

export const buildCollectionFolderViewStateHandler = async (
  args: {
    req: PayloadRequest
  } & BuildCollectionFolderViewStateHandlerArgs,
): Promise<BuildCollectionFolderViewStateResult> => {
  const {
    collectionSlug,
    disableBulkDelete,
    disableBulkEdit,
    enableRowSelections,
    folderID,
    isInDrawer,
    overrideEntityVisibility,
    query,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
    viewType,
  } = args

  const incomingUserSlug = user?.collection
  const adminUserSlug = config.admin.user

  // If we have a user slug, test it against the functions
  if (incomingUserSlug) {
    const adminAccessFunction = payload.collections[incomingUserSlug].config.access?.admin

    // Run the admin access function from the config if it exists
    if (adminAccessFunction) {
      const canAccessAdmin = await adminAccessFunction({ req })

      if (!canAccessAdmin) {
        throw new Error('Unauthorized')
      }
      // Match the user collection to the global admin config
    } else if (adminUserSlug !== incomingUserSlug) {
      throw new Error('Unauthorized')
    }
  } else {
    const hasUsers = await payload.find({
      collection: adminUserSlug,
      depth: 0,
      limit: 1,
      pagination: false,
    })

    // If there are no users, we should not allow access because of /create-first-user
    if (hasUsers.docs.length) {
      throw new Error('Unauthorized')
    }
  }

  return buildCollectionFolderView({
    clientConfig: getClientConfig({
      config,
      i18n,
      importMap: payload.importMap,
    }),
    disableBulkDelete,
    disableBulkEdit,
    enableRowSelections,
    i18n,
    importMap: payload.importMap,
    initPageResult: {
      // will need to adjust for viewType === 'folders' as it is polymorphic
      collectionConfig: payload?.collections?.[collectionSlug]?.config,
      cookies: parseCookies(await getHeaders()),
      languageOptions: undefined, // TODO
      permissions: await getAccessResults({
        req,
      }),
      req,
      translations: undefined, // TODO
      visibleEntities: {
        collections: payload.config.collections
          .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
          .filter(Boolean),
        globals: undefined,
      },
    },
    isInDrawer,
    overrideEntityVisibility,
    params: {
      segments: [
        viewType === 'collection-folders' && 'collections',
        viewType === 'collection-folders' && collectionSlug,
        'folders',
        typeof folderID === 'number' ? String(folderID) : folderID,
      ].filter(Boolean),
    },
    payload,
    query,
    searchParams: {},
    viewType,
  })
}
