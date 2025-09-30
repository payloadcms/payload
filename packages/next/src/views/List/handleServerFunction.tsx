import type { CollectionPreferences, ListQuery, ServerFunction, VisibleEntities } from 'payload'

import { getClientConfig } from '@payloadcms/ui/utilities/getClientConfig'
import { headers as getHeaders } from 'next/headers.js'
import { canAccessAdmin, getAccessResults, isEntityHidden, parseCookies } from 'payload'

import { renderListView } from './index.js'

type RenderListResult = {
  List: React.ReactNode
  preferences: CollectionPreferences
}

export const renderListHandler: ServerFunction<
  {
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
  },
  Promise<RenderListResult>
> = async (args) => {
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

  await canAccessAdmin({ req })

  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap: payload.importMap,
    user,
  })

  const preferencesKey = `collection-${collectionSlug}`

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
    .then((res) => res.docs[0]?.value as CollectionPreferences)

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
