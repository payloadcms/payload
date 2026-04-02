import type {
  CollectionPreferences,
  ImportMap,
  InitReqResult,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { applyLocaleFiltering, formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'

import { getClientConfig } from '../../utilities/getClientConfig.js'
import { getPreferences } from '../../utilities/getPreferences.js'
import { getVisibleEntities } from '../../utilities/getVisibleEntities.js'
import { handleAuthRedirect } from '../../utilities/handleAuthRedirect.js'
import { isCustomAdminView } from '../../utilities/isCustomAdminView.js'
import { isPublicAdminRoute } from '../../utilities/isPublicAdminRoute.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'
import { getRouteData } from './getRouteData.js'

export type RootPageDescriptor = {
  browseByFolderSlugs: ReturnType<typeof getRouteData>['browseByFolderSlugs']
  clientConfig: ReturnType<typeof getClientConfig>
  collectionConfig?: SanitizedCollectionConfig
  DefaultView: ReturnType<typeof getRouteData>['DefaultView']
  documentSubViewType?: ReturnType<typeof getRouteData>['documentSubViewType']
  globalConfig?: SanitizedGlobalConfig
  routeParams: ReturnType<typeof getRouteData>['routeParams']
  templateClassName: ReturnType<typeof getRouteData>['templateClassName']
  templateType: ReturnType<typeof getRouteData>['templateType']
  viewActions?: ReturnType<typeof getRouteData>['viewActions']
  viewType?: ReturnType<typeof getRouteData>['viewType']
  visibleEntities: ReturnType<typeof getVisibleEntities>
}

export type RootPageDescriptorResult =
  | {
      descriptor: RootPageDescriptor
      type: 'page'
    }
  | {
      type: 'not-found'
    }
  | {
      type: 'redirect'
      url: string
    }

const getRouteEntityConfigs = (args: {
  config: InitReqResult['req']['payload']['config']
  currentRoute: string
  segments: string[]
}):
  | {
      collectionConfig?: SanitizedCollectionConfig
      globalConfig?: SanitizedGlobalConfig
      type: 'ok'
    }
  | {
      type: 'not-found'
    }
  | {
      type: 'redirect'
      url: string
    } => {
  const { config, currentRoute, segments } = args
  const {
    routes: { admin: adminRoute },
  } = config

  const isCollectionRoute = segments[0] === 'collections'
  const isGlobalRoute = segments[0] === 'globals'
  let collectionConfig: SanitizedCollectionConfig = undefined
  let globalConfig: SanitizedGlobalConfig = undefined

  if (isCollectionRoute) {
    if (segments.length === 1) {
      const { viewKey } = getCustomViewByRoute({
        config,
        currentRoute: '/collections',
      })

      if (!viewKey) {
        return {
          type: 'redirect',
          url: adminRoute,
        }
      }
    }

    if (segments[1]) {
      collectionConfig = config.collections.find(({ slug }) => slug === segments[1])
    }
  }

  if (isGlobalRoute) {
    if (segments.length === 1) {
      const { viewKey } = getCustomViewByRoute({
        config,
        currentRoute: '/globals',
      })

      if (!viewKey) {
        return {
          type: 'redirect',
          url: adminRoute,
        }
      }
    }

    if (segments[1]) {
      globalConfig = config.globals.find(({ slug }) => slug === segments[1])
    }
  }

  if ((isCollectionRoute && !collectionConfig) || (isGlobalRoute && !globalConfig)) {
    return {
      type: 'not-found',
    }
  }

  return {
    type: 'ok',
    collectionConfig,
    globalConfig,
  }
}

export const getRootPageDescriptor = async (args: {
  importMap: ImportMap
  initPageResult: InitReqResult
  searchParams: { [key: string]: string | string[] }
  segments: string[]
}): Promise<RootPageDescriptorResult> => {
  const { importMap, initPageResult, searchParams, segments } = args
  const {
    cookies,
    locale,
    permissions,
    req,
    req: { payload },
  } = initPageResult

  const config = payload.config
  const {
    admin: {
      routes: { createFirstUser: createFirstUserRouteValue },
      user: userSlug,
    },
    routes: { admin: adminRoute },
  } = config

  const currentRoute = formatAdminURL({
    adminRoute,
    path: Array.isArray(segments) && segments.length > 0 ? `/${segments.join('/')}` : null,
  })

  const routeEntityConfigs = getRouteEntityConfigs({
    config,
    currentRoute,
    segments,
  })

  if (routeEntityConfigs.type === 'redirect') {
    return routeEntityConfigs
  }

  if (routeEntityConfigs.type === 'not-found') {
    return routeEntityConfigs
  }

  const { collectionConfig, globalConfig } = routeEntityConfigs

  if (
    !permissions.canAccessAdmin &&
    !isPublicAdminRoute({ adminRoute, config: payload.config, route: currentRoute }) &&
    !isCustomAdminView({ adminRoute, config: payload.config, route: currentRoute })
  ) {
    return {
      type: 'redirect',
      url: handleAuthRedirect({
        config: payload.config,
        route: currentRoute,
        searchParams,
        user: req.user,
      }),
    }
  }

  let collectionPreferences: CollectionPreferences = undefined

  if (collectionConfig && segments.length === 2) {
    if (config.folders && collectionConfig.folders && segments[1] !== config.folders.slug) {
      await getPreferences<CollectionPreferences>(
        `collection-${collectionConfig.slug}`,
        req.payload,
        req.user?.id,
        config.admin.user,
      ).then((res) => {
        if (res?.value) {
          collectionPreferences = res.value
        }
      })
    }
  }

  const {
    browseByFolderSlugs,
    DefaultView,
    documentSubViewType,
    routeParams,
    templateClassName,
    templateType,
    viewActions,
    viewType,
  } = getRouteData({
    adminRoute,
    collectionConfig,
    collectionPreferences,
    currentRoute,
    globalConfig,
    payload,
    searchParams,
    segments,
  })

  // Root consumers rely on req.routeParams being populated before downstream views execute.
  req.routeParams = routeParams

  const dbHasUser =
    req.user ||
    (await req.payload.db
      .findOne({
        collection: userSlug,
        req,
      })
      ?.then((doc) => !!doc))

  if (!DefaultView?.Component && !DefaultView?.payloadComponent) {
    if (req.user) {
      return {
        type: 'not-found',
      }
    }

    if (dbHasUser) {
      return {
        type: 'redirect',
        url: adminRoute,
      }
    }
  }

  const usersCollection = config.collections.find(({ slug }) => slug === userSlug)
  const disableLocalStrategy = usersCollection?.auth?.disableLocalStrategy
  const createFirstUserRoute = formatAdminURL({
    adminRoute,
    path: createFirstUserRouteValue,
  })

  if (disableLocalStrategy && currentRoute === createFirstUserRoute) {
    return {
      type: 'redirect',
      url: adminRoute,
    }
  }

  if (!dbHasUser && currentRoute !== createFirstUserRoute && !disableLocalStrategy) {
    return {
      type: 'redirect',
      url: createFirstUserRoute,
    }
  }

  if (dbHasUser && currentRoute === createFirstUserRoute) {
    return {
      type: 'redirect',
      url: adminRoute,
    }
  }

  if (!DefaultView?.Component && !DefaultView?.payloadComponent && !dbHasUser) {
    return {
      type: 'redirect',
      url: adminRoute,
    }
  }

  const clientConfig = getClientConfig({
    config,
    i18n: req.i18n,
    importMap,
    user: viewType === 'createFirstUser' ? true : req.user,
  })

  await applyLocaleFiltering({ clientConfig, config, req })

  if (
    clientConfig.localization &&
    req.locale &&
    !clientConfig.localization.localeCodes.includes(req.locale)
  ) {
    return {
      type: 'redirect',
      url: `${currentRoute}${qs.stringify(
        {
          ...searchParams,
          locale: clientConfig.localization.localeCodes.includes(
            clientConfig.localization.defaultLocale,
          )
            ? clientConfig.localization.defaultLocale
            : clientConfig.localization.localeCodes[0],
        },
        { addQueryPrefix: true },
      )}`,
    }
  }

  const visibleEntities = getVisibleEntities({ req })

  return {
    type: 'page',
    descriptor: {
      browseByFolderSlugs,
      clientConfig,
      collectionConfig,
      DefaultView,
      documentSubViewType,
      globalConfig,
      routeParams,
      templateClassName,
      templateType,
      viewActions,
      viewType,
      visibleEntities,
    },
  }
}
