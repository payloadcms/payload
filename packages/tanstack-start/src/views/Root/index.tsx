import type {
  AdminViewClientProps,
  CollectionPreferences,
  ImportMap,
  SanitizedConfig,
} from 'payload'

import { getRootViewData } from '@payloadcms/ui/views/Root/getRootViewData'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

import type { GetRouteDataResult } from './getRouteData.js'

import { getPreferences } from '../../utilities/getPreferences.js'
import { initReq } from '../../utilities/initReq.js'
import { getRouteData } from './getRouteData.js'

export type AdminPageData = {
  routeData: GetRouteDataResult
  viewProps: AdminViewClientProps
}

export type GetAdminPageDataArgs = {
  configPromise: Promise<SanitizedConfig> | SanitizedConfig
  importMap: ImportMap
  params: { segments: string[] }
  searchParams: { [key: string]: string | string[] }
}

/**
 * Loads all data needed for an admin page. Call this in your TanStack Start
 * catch-all route loader to get both layout data and view-specific data.
 *
 * Returns `{ redirect }` if the adapter should redirect, or full page data otherwise.
 */
export async function getAdminPageData({
  configPromise,
  importMap,
  params,
  searchParams,
}: GetAdminPageDataArgs): Promise<{ data: AdminPageData } | { redirect: string }> {
  const config = await configPromise
  const segments = Array.isArray(params.segments) ? params.segments : []

  const {
    routes: { admin: adminRoute },
  } = config

  const currentRoute = formatAdminURL({
    adminRoute,
    path: segments.length ? `/${segments.join('/')}` : null,
  })
  const queryString = qs.stringify(searchParams ?? {}, { addQueryPrefix: true })

  const initResult = await initReq({
    configPromise: config,
    importMap,
    overrides: {
      fallbackLocale: false,
      req: {
        query: qs.parse(queryString, {
          depth: 10,
          ignoreQueryPrefix: true,
        }),
      },
      urlSuffix: `${currentRoute}${searchParams ? queryString : ''}`,
    },
  })

  let rootData: Awaited<ReturnType<typeof getRootViewData>>

  try {
    rootData = await getRootViewData({
      config,
      importMap,
      initResult,
      params,
      searchParams,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'not-found') {
      throw new Error('not-found')
    }
    throw error
  }

  if (rootData.redirect) {
    return { redirect: rootData.redirect }
  }

  const { collectionConfig, globalConfig, req } = rootData

  let collectionPreferences: CollectionPreferences | undefined

  if (collectionConfig && segments.length === 2) {
    if (
      config.folders &&
      collectionConfig.folders &&
      segments[1] !== config.folders.slug &&
      req.user
    ) {
      const prefs = await getPreferences<CollectionPreferences>(
        `collection-${collectionConfig.slug}`,
        req.payload,
        req.user.id,
        config.admin.user,
      )
      if (prefs?.value) {
        collectionPreferences = prefs.value
      }
    }
  }

  const routeData = getRouteData({
    adminRoute,
    collectionConfig,
    collectionPreferences,
    currentRoute: rootData.currentRoute,
    globalConfig,
    payload: req.payload,
    searchParams,
    segments,
  })

  req.routeParams = routeData.routeParams

  const viewProps: AdminViewClientProps = {
    browseByFolderSlugs: routeData.browseByFolderSlugs,
    clientConfig: rootData.clientConfig,
    documentSubViewType: routeData.documentSubViewType,
    viewType: routeData.viewType ?? 'dashboard',
  }

  return {
    data: {
      routeData,
      viewProps,
    },
  }
}
