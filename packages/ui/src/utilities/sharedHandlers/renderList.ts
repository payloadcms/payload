import type { CollectionPreferences, ServerFunction, VisibleEntities } from 'payload'

import { canAccessAdmin, isEntityHidden, UnauthorizedError } from 'payload'
import { applyLocaleFiltering } from 'payload/shared'

import type {
  RenderListServerFnArgs,
  RenderListServerFnReturnType,
} from '../../elements/ListDrawer/types.js'

import { ListViewRSC } from '../../views/List/ListViewRSC.js'
import { getClientConfig } from '../getClientConfig.js'

/**
 * Framework-agnostic `'render-list'` server function. Used by drawers and
 * other on-demand list-render flows in both the Next.js and TanStack Start
 * adapters. Returns a React node (`List`) that adapters ship to the client
 * either via Next's RSC payload or, for TanStack Start, via
 * `serializeForRsc` + `createServerFn`.
 *
 * Throws `Error('not-found')` when the user lacks access; adapters translate
 * that into their framework-specific 404 response.
 */
export const renderListHandler: ServerFunction<
  RenderListServerFnArgs,
  Promise<RenderListServerFnReturnType>
> = async (args) => {
  const {
    collectionSlug,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections,
    locale,
    overrideEntityVisibility,
    permissions,
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

  if (!req.user) {
    throw new UnauthorizedError()
  }

  await canAccessAdmin({ req })

  const clientConfig = getClientConfig({
    config,
    i18n,
    importMap: payload.importMap,
    user,
  })
  await applyLocaleFiltering({ clientConfig, config, req })

  const preferencesKey = `collection-${collectionSlug}`

  const preferences = await payload
    .find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      where: {
        and: [
          { key: { equals: preferencesKey } },
          { 'user.relationTo': { equals: user.collection } },
          { 'user.value': { equals: user.id } },
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

  const collectionConfig = payload?.collections?.[collectionSlug]?.config

  const List = await ListViewRSC({
    clientConfig,
    collectionConfig,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections: enableRowSelections ?? true,
    locale,
    overrideEntityVisibility,
    params: { segments: ['collections', collectionSlug] },
    permissions,
    query,
    redirectAfterDelete,
    redirectAfterDuplicate,
    req,
    searchParams: {},
    viewType: 'list',
    visibleEntities,
  })

  return {
    List,
    preferences,
  }
}
