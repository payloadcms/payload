import type { ListQuery, ServerFunction, VisibleEntities } from 'payload'
import type React from 'react'

import { canAccessAdmin, isEntityHidden, UnauthorizedError } from 'payload'
import { applyLocaleFiltering } from 'payload/shared'

import { getClientConfig } from '../../utilities/getClientConfig.js'
import { buildCollectionFolderView } from './buildView.js'

export type RenderCollectionFolderServerFnArgs = {
  collectionSlug: string
  folderID?: number | string
  query?: ListQuery
  searchParams?: Record<string, string | string[]>
}

export type RenderCollectionFolderServerFnReturnType = {
  View: React.ReactNode
}

export const renderCollectionFolderHandler: ServerFunction<
  RenderCollectionFolderServerFnArgs,
  Promise<RenderCollectionFolderServerFnReturnType>
> = async (args) => {
  const {
    collectionSlug,
    folderID,
    query,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user,
    },
    searchParams = {},
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

  const visibleEntities: VisibleEntities = {
    collections: payload.config.collections
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
    globals: payload.config.globals
      .map(({ slug, admin: { hidden } }) => (!isEntityHidden({ hidden, user }) ? slug : null))
      .filter(Boolean),
  }

  const { View } = await buildCollectionFolderView({
    clientConfig,
    enableRowSelections: true,
    folderID,
    i18n,
    importMap: payload.importMap,
    initPageResult: {
      collectionConfig: payload?.collections?.[collectionSlug]?.config,
      cookies: undefined,
      languageOptions: undefined,
      locale:
        req.locale && clientConfig.localization
          ? clientConfig.localization.locales?.find((l) => l.code === req.locale)
          : undefined,
      permissions: undefined,
      req,
      translations: undefined,
      visibleEntities,
    },
    params: {
      segments: folderID
        ? [
            'collections',
            collectionSlug,
            config.folders ? config.folders.slug : 'folders',
            String(folderID),
          ]
        : ['collections', collectionSlug, config.folders ? config.folders.slug : 'folders'],
    },
    payload,
    query: query ?? {},
    redirect: (url: string) => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw { href: url }
    },
    searchParams,
    viewType: 'collection-folders',
  })

  return { View }
}
