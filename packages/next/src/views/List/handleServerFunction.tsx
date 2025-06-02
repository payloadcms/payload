import type { ListPreferences, ListQuery, PayloadRequest, VisibleEntities } from 'payload'

import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { headers as getHeaders } from 'next/headers.js'
import { getAccessResults, isEntityHidden, parseCookies } from 'payload'

import { renderListView } from './index.js'

type RenderListResult = {
  List: React.ReactNode
  preferences: ListPreferences
}

export const renderListHandler = async (args: {
  collectionSlug: string
  disableActions?: boolean
  disableBulkDelete?: boolean
  disableBulkEdit?: boolean
  disableQueryPresets?: boolean
  documentDrawerSlug: string
  drawerSlug?: string
  enableRowSelections: boolean
  overrideEntityVisibility?: boolean
  query: ListQuery
  redirectAfterDelete: boolean
  redirectAfterDuplicate: boolean
  req: PayloadRequest
}): Promise<RenderListResult> => {
  const {
    collectionSlug,
    disableActions,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections,
    overrideEntityVisibility,
    query,
    redirectAfterDelete,
    redirectAfterDuplicate,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
  } = args

  const headers = await getHeaders()

  const cookies = parseCookies(headers)

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

    // If there are users, we should not allow access because of /create-first-user
    if (hasUsers.docs.length) {
      throw new Error('Unauthorized')
    }
  }

  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap: payload.importMap,
  })

  const preferencesKey = `${collectionSlug}-list`

  const preferences = await payload
    .find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      where: {
        and: [
          {
            key: {
              equals: preferencesKey,
            },
          },
          {
            'user.relationTo': {
              equals: user.collection,
            },
          },
          {
            'user.value': {
              equals: user.id,
            },
          },
        ],
      },
    })
    .then((res) => res.docs[0]?.value as ListPreferences)

  const visibleEntities: VisibleEntities = {
    collections: payload.config.collections
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
    globals: payload.config.globals
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
  }

  const permissions = await getAccessResults({
    req,
  })

  const { List } = await renderListView({
    clientConfig,
    disableActions,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections,
    i18n,
    importMap: payload.importMap,
    initPageResult: {
      collectionConfig: payload?.collections?.[collectionSlug]?.config,
      cookies,
      globalConfig: payload.config.globals.find((global) => global.slug === collectionSlug),
      languageOptions: undefined, // TODO
      permissions,
      req,
      translations: undefined, // TODO
      visibleEntities,
    },
    overrideEntityVisibility,
    params: {
      segments: ['collections', collectionSlug],
    },
    payload,
    query,
    redirectAfterDelete,
    redirectAfterDuplicate,
    searchParams: {},
    viewType: 'list',
  })

  return {
    List,
    preferences,
  }
}
