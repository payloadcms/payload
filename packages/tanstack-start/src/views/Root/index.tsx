import type { NavGroupType } from '@payloadcms/ui/shared'
import type {
  AdminViewClientProps,
  ClientUser,
  CollectionPreferences,
  CollectionSlug,
  CustomComponent,
  DocumentSubViewTypes,
  ImportMap,
  ListQuery,
  Locale,
  NavPreferences,
  PaginatedDocs,
  SanitizedConfig,
  SanitizedPermissions,
  ViewTypes,
  VisibleEntities,
} from 'payload'

import { getNavData } from '@payloadcms/ui/elements/Nav/getNavData'
import { getGlobalData, getNavGroups } from '@payloadcms/ui/shared'
import { getLoginViewData } from '@payloadcms/ui/views/Login/getLoginViewData'
import { getRootViewData } from '@payloadcms/ui/views/Root/getRootViewData'
import { formatAdminURL, isNumber } from 'payload/shared'
import * as qs from 'qs-esm'

import { getPreferences } from '../../utilities/getPreferences.js'
import { initReq } from '../../utilities/initReq.js'
import { getRouteData } from './getRouteData.js'

/**
 * Serializable subset of route data safe for transport over JSON.
 * Omits `collectionConfig` and `globalConfig` (server-only, contain functions).
 */
export type SerializableRouteData = {
  browseByFolderSlugs: CollectionSlug[]
  collectionSlug?: string
  documentSubViewType?: DocumentSubViewTypes
  globalSlug?: string
  hasView: boolean
  routeParams: {
    collection?: string
    folderCollection?: string
    folderID?: number | string
    global?: string
    id?: number | string
    token?: string
    versionID?: number | string
  }
  templateClassName: string
  templateType: 'default' | 'minimal' | undefined
  viewActions?: CustomComponent[]
  viewType?: ViewTypes
}

export type SerializableListData = {
  collectionLabel: string
  collectionSlug: string
  data: PaginatedDocs
  hasCreatePermission: boolean
  hasDeletePermission: boolean
  newDocumentURL: string
  query: ListQuery
}

export type SerializableDashboardData = {
  globalData: Array<{
    data: { _isLocked: boolean; _lastEditedAt: string; _userEditing: ClientUser | number | string }
    lockDuration?: number
    slug: string
  }>
  navGroups: NavGroupType[]
}

export type SerializableLoginData = {
  isLocalStrategyDisabled: boolean
  prefillEmail?: string
  prefillPassword?: string
  prefillUsername?: string
}

export type AdminPageData = {
  dashboardData?: SerializableDashboardData
  listData?: SerializableListData
  locale: Locale
  loginData?: SerializableLoginData
  navGroups: NavGroupType[]
  navPreferences: NavPreferences
  permissions: SanitizedPermissions
  routeData: SerializableRouteData
  viewProps: AdminViewClientProps
  visibleEntities: VisibleEntities
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

  const { groups: navGroups, navPreferences } = await getNavData({
    i18n: req.i18n,
    permissions: rootData.permissions,
    req,
    visibleEntities: rootData.visibleEntities,
  })

  const viewProps: AdminViewClientProps = {
    browseByFolderSlugs: routeData.browseByFolderSlugs,
    clientConfig: rootData.clientConfig,
    documentSubViewType: routeData.documentSubViewType,
    viewType: routeData.viewType ?? 'dashboard',
  }

  const serializableRouteData: SerializableRouteData = {
    browseByFolderSlugs: routeData.browseByFolderSlugs,
    collectionSlug: routeData.collectionConfig?.slug,
    documentSubViewType: routeData.documentSubViewType,
    globalSlug: routeData.globalConfig?.slug,
    hasView: routeData.hasView,
    routeParams: routeData.routeParams,
    templateClassName: routeData.templateClassName,
    templateType: routeData.templateType,
    viewActions: routeData.viewActions,
    viewType: routeData.viewType,
  }

  const adminPageData: AdminPageData = {
    locale: rootData.locale,
    navGroups,
    navPreferences,
    permissions: rootData.permissions,
    routeData: serializableRouteData,
    viewProps,
    visibleEntities: rootData.visibleEntities,
  }

  const viewType = routeData.viewType

  if (viewType === 'list' && collectionConfig) {
    const collectionPermission = rootData.permissions?.collections?.[collectionConfig.slug]
    const limit = isNumber(searchParams?.limit)
      ? Number(searchParams.limit)
      : (collectionConfig.admin?.pagination?.defaultLimit ?? 10)
    const page = isNumber(searchParams?.page) ? Number(searchParams.page) : 1
    const sort = (searchParams?.sort as string) || collectionConfig.defaultSort || 'createdAt'

    const data = await req.payload.find({
      collection: collectionConfig.slug,
      depth: 0,
      limit,
      page,
      sort,
      user: req.user,
    })

    adminPageData.listData = {
      collectionLabel:
        typeof collectionConfig.labels.plural === 'string'
          ? collectionConfig.labels.plural
          : collectionConfig.slug,
      collectionSlug: collectionConfig.slug,
      data,
      hasCreatePermission: !!collectionPermission?.create,
      hasDeletePermission: !!collectionPermission?.delete,
      newDocumentURL: formatAdminURL({
        adminRoute,
        path: `/collections/${collectionConfig.slug}/create`,
      }),
      query: { limit, page, sort } as ListQuery,
    }
  }

  if (viewType === 'dashboard') {
    const globalData = await getGlobalData(req)
    const dashboardNavGroups = getNavGroups(
      rootData.permissions,
      rootData.visibleEntities,
      config,
      req.i18n,
    )

    adminPageData.dashboardData = {
      globalData,
      navGroups: dashboardNavGroups,
    }
  }

  if (serializableRouteData.templateClassName === 'login') {
    const loginData = getLoginViewData({
      config,
      searchParams,
      user: req.user,
    })

    if (loginData.isLoggedIn) {
      return { redirect: loginData.redirectUrl }
    }

    adminPageData.loginData = {
      isLocalStrategyDisabled: loginData.isLocalStrategyDisabled,
      prefillEmail: loginData.prefillEmail,
      prefillPassword: loginData.prefillPassword,
      prefillUsername: loginData.prefillUsername,
    }
  }

  return { data: adminPageData }
}
