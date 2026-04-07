import type {
  ClientConfig,
  CollectionPreferences,
  ImportMap,
  InitReqResult,
  Locale,
  PayloadRequest,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedPermissions,
  VisibleEntities,
} from 'payload'

import { applyLocaleFiltering, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'
import { getCustomViewByRoute } from '../../utilities/routeResolution/getCustomViewByRoute.js'

export type RootViewData = {
  clientConfig: ClientConfig
  collectionConfig?: SanitizedCollectionConfig
  cookies: Map<string, string>
  currentRoute: string
  dbHasUser: boolean
  globalConfig?: SanitizedGlobalConfig
  locale: Locale
  permissions: SanitizedPermissions
  /**
   * If set, the adapter should redirect to this URL.
   */
  redirect?: string
  req: PayloadRequest
  searchParams: { [key: string]: string | string[] }
  segments: string[]
  visibleEntities: VisibleEntities
}

export type GetRootViewDataArgs = {
  /** Collection preferences for folder view detection (adapter can pre-fetch) */
  collectionPreferences?: CollectionPreferences
  config: SanitizedConfig
  importMap: ImportMap
  initResult: InitReqResult
  params: { segments: string[] }
  searchParams: { [key: string]: string | string[] }
}

/**
 * Framework-agnostic root view data initializer.
 *
 * Handles auth checks, first-user redirects, config resolution, locale filtering,
 * and returns all the data that any adapter's route resolution needs.
 *
 * Does NOT resolve which view component to render (that's adapter-specific).
 * Returns `redirect` when the adapter should perform a redirect.
 */
export async function getRootViewData(args: GetRootViewDataArgs): Promise<RootViewData> {
  const {
    config,
    importMap,
    initResult: { cookies, locale, permissions, req },
    params,
    searchParams,
  } = args

  const {
    admin: {
      routes: { createFirstUser: _createFirstUserRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute },
  } = config

  const segments = Array.isArray(params.segments) ? params.segments : []
  const currentRoute = formatAdminURL({
    adminRoute,
    path: segments.length ? `/${segments.join('/')}` : null,
  })

  const isCollectionRoute = segments[0] === 'collections'
  const isGlobalRoute = segments[0] === 'globals'
  let collectionConfig: SanitizedCollectionConfig = undefined
  let globalConfig: SanitizedGlobalConfig = undefined

  if (isCollectionRoute) {
    if (segments.length === 1) {
      const { viewKey } = getCustomViewByRoute({ config, currentRoute: '/collections' })

      if (!viewKey) {
        return { redirect: adminRoute } as RootViewData
      }
    }

    if (segments[1]) {
      collectionConfig = config.collections.find(({ slug }) => slug === segments[1])
    }
  }

  if (isGlobalRoute) {
    if (segments.length === 1) {
      const { viewKey } = getCustomViewByRoute({ config, currentRoute: '/globals' })

      if (!viewKey) {
        return { redirect: adminRoute } as RootViewData
      }
    }

    if (segments[1]) {
      globalConfig = config.globals.find(({ slug }) => slug === segments[1])
    }
  }

  if ((isCollectionRoute && !collectionConfig) || (isGlobalRoute && !globalConfig)) {
    throw new Error('not-found')
  }

  const { payload } = req

  if (!permissions.canAccessAdmin && !isPublicRoute(adminRoute, config, currentRoute)) {
    const redirectUrl = handleAuthRedirect({
      config: payload.config,
      route: currentRoute,
      searchParams,
      user: req.user,
    })

    return { redirect: redirectUrl } as RootViewData
  }

  const dbHasUser =
    req.user ||
    (await req.payload.db
      .findOne({
        collection: userSlug,
        req,
      })
      ?.then((doc) => !!doc))

  const usersCollection = config.collections.find(({ slug }) => slug === userSlug)
  const disableLocalStrategy = usersCollection?.auth?.disableLocalStrategy

  const createFirstUserRoute = formatAdminURL({
    adminRoute,
    path: _createFirstUserRoute,
  })

  if (disableLocalStrategy && currentRoute === createFirstUserRoute) {
    return { redirect: adminRoute } as RootViewData
  }

  if (!dbHasUser && currentRoute !== createFirstUserRoute && !disableLocalStrategy) {
    return { redirect: createFirstUserRoute } as RootViewData
  }

  if (dbHasUser && currentRoute === createFirstUserRoute) {
    return { redirect: adminRoute } as RootViewData
  }

  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user: !dbHasUser ? true : req.user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  if (
    clientConfig.localization &&
    req.locale &&
    !clientConfig.localization.localeCodes.includes(req.locale)
  ) {
    const redirectLocale = clientConfig.localization.localeCodes.includes(
      clientConfig.localization.defaultLocale,
    )
      ? clientConfig.localization.defaultLocale
      : clientConfig.localization.localeCodes[0]

    const redirectUrl = `${currentRoute}${qs.stringify(
      { ...searchParams, locale: redirectLocale },
      { addQueryPrefix: true },
    )}`

    return { redirect: redirectUrl } as RootViewData
  }

  const visibleEntities = getVisibleEntities({ req })

  return {
    clientConfig,
    collectionConfig,
    cookies,
    currentRoute,
    dbHasUser: !!dbHasUser,
    globalConfig,
    locale,
    permissions,
    req,
    searchParams,
    segments,
    visibleEntities,
  }
}

function getRouteWithoutAdmin(adminRoute: string, route: string): string {
  return adminRoute && adminRoute !== '/' ? route.replace(adminRoute, '') : route
}

function isPublicRoute(adminRoute: string, config: SanitizedConfig, route: string): boolean {
  const publicAdminRoutes: (keyof Pick<
    SanitizedConfig['admin']['routes'],
    'createFirstUser' | 'forgot' | 'inactivity' | 'login' | 'logout' | 'reset' | 'unauthorized'
  >)[] = [
    'createFirstUser',
    'forgot',
    'login',
    'logout',
    'forgot',
    'inactivity',
    'unauthorized',
    'reset',
  ]

  const isPublic = publicAdminRoutes.some((routeSegment) => {
    const segment = config.admin?.routes?.[routeSegment] || routeSegment
    const routeWithoutAdmin = getRouteWithoutAdmin(adminRoute, route)

    if (routeWithoutAdmin.startsWith(segment)) {
      return true
    } else if (routeWithoutAdmin.includes('/verify/')) {
      return true
    }

    return false
  })

  if (isPublic) {
    return true
  }

  if (config.admin?.components?.views) {
    return Object.entries(config.admin.components.views).some(([, view]) => {
      const routeWithoutAdmin = getRouteWithoutAdmin(adminRoute, route)

      if (view.exact) {
        return routeWithoutAdmin === view.path
      }

      return (
        view.path &&
        view.path !== '/' &&
        (routeWithoutAdmin === view.path || routeWithoutAdmin.startsWith(view.path + '/'))
      )
    })
  }

  return false
}

function handleAuthRedirect({
  config,
  route,
  searchParams,
  user,
}: {
  config: SanitizedConfig
  route: string
  searchParams: { [key: string]: string | string[] }
  user?: unknown
}): string {
  const {
    admin: {
      routes: { login: loginRouteFromConfig, unauthorized: unauthorizedRoute },
    },
    routes: { admin: adminRoute },
  } = config

  const paramsCopy = { ...searchParams }

  if ('redirect' in paramsCopy) {
    delete paramsCopy.redirect
  }

  const redirectRoute =
    (route !== adminRoute ? route : '') +
    (Object.keys(paramsCopy ?? {}).length > 0
      ? `${qs.stringify(paramsCopy, { addQueryPrefix: true })}`
      : '')

  const redirectTo = formatAdminURL({
    adminRoute,
    path: user ? unauthorizedRoute : loginRouteFromConfig,
  })

  const parsedLoginRouteSearchParams = qs.parse(redirectTo.split('?')[1] ?? '')

  const searchParamsWithRedirect = `${qs.stringify(
    {
      ...parsedLoginRouteSearchParams,
      ...(redirectRoute ? { redirect: redirectRoute } : {}),
    },
    { addQueryPrefix: true },
  )}`

  return `${redirectTo.split('?', 1)[0]}${searchParamsWithRedirect}`
}
