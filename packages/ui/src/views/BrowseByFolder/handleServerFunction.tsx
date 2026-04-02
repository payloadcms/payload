import type { ListQuery, ServerFunction, VisibleEntities } from 'payload'
import type React from 'react'

import { canAccessAdmin, isEntityHidden, UnauthorizedError } from 'payload'
import { applyLocaleFiltering } from 'payload/shared'

import { getClientConfig } from '../../utilities/getClientConfig.js'
import { buildBrowseByFolderView } from './buildView.js'

export type RenderBrowseFolderServerFnArgs = {
  browseByFolderSlugs?: string[]
  folderID?: number | string
  query?: ListQuery
  searchParams?: Record<string, string | string[]>
}

export type RenderBrowseFolderServerFnReturnType = {
  View: React.ReactNode
}

export const renderBrowseFolderHandler: ServerFunction<
  RenderBrowseFolderServerFnArgs,
  Promise<RenderBrowseFolderServerFnReturnType>
> = async (args) => {
  const {
    browseByFolderSlugs = [],
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

  const { View } = await buildBrowseByFolderView({
    browseByFolderSlugs,
    clientConfig,
    enableRowSelections: true,
    folderID,
    i18n,
    importMap: payload.importMap,
    initPageResult: {
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
      segments: folderID ? ['browse-by-folder', String(folderID)] : ['browse-by-folder'],
    },
    payload,
    query: query ?? {},
    redirect: (url: string) => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw { href: url }
    },
    searchParams,
    viewType: 'folders',
  })

  return { View }
}
