import type { CollectionPreferences, ServerFunction, VisibleEntities } from 'payload'

import { canAccessAdmin, isEntityHidden, UnauthorizedError } from 'payload'
import { applyLocaleFiltering } from 'payload/shared'

import type { SerializableListViewData } from '../../views/List/buildListViewClientProps.js'

import { RenderClientComponent } from '../../elements/RenderServerComponent/clientOnly.js'
import { getListViewData } from '../../views/List/getListViewData.js'
import { toSerializableListViewData } from '../../views/List/toSerializableListViewData.js'
import { getClientConfig } from '../getClientConfig.js'

export type RenderListDataOnlyResult = {
  listViewData: SerializableListViewData
  preferences?: CollectionPreferences
}

/**
 * Data-only alternative to `renderListHandler` (packages/next).
 * Returns `SerializableListViewData` instead of `{ List: ReactNode }`.
 */
export const renderListDataOnlyHandler: ServerFunction<
  {
    collectionSlug: string
    disableActions?: boolean
    disableBulkDelete?: boolean
    disableBulkEdit?: boolean
    disableQueryPresets?: boolean
    drawerSlug?: string
    enableRowSelections?: boolean
    overrideEntityVisibility?: boolean
    query?: Record<string, unknown>
    redirectAfterDelete?: boolean
    redirectAfterDuplicate?: boolean
  },
  Promise<RenderListDataOnlyResult>
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
    renderComponent,
    req,
    req: {
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
    i18n: req.i18n,
    importMap: payload.importMap,
    user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  const visibleEntities: VisibleEntities = {
    collections: payload.config.collections
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
    globals: payload.config.globals
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
  }

  const collectionConfig = payload?.collections?.[collectionSlug]?.config

  const listViewData = await getListViewData({
    clientConfig,
    collectionConfig,
    disableBulkDelete,
    disableBulkEdit,
    disableQueryPresets,
    drawerSlug,
    enableRowSelections: enableRowSelections ?? true,
    locale,
    overrideEntityVisibility,
    permissions,
    query: query as any,
    renderComponent: renderComponent || RenderClientComponent,
    req,
    viewType: 'list',
    visibleEntities,
  })

  const isHidden = collectionConfig?.admin?.hidden === true

  const serializable = toSerializableListViewData({
    collectionConfig,
    fieldPermissions: isHidden ? true : permissions?.collections?.[collectionSlug]?.fields,
    listViewData,
  })

  return {
    listViewData: serializable,
    preferences: listViewData.collectionPreferences,
  }
}
