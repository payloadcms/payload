import type {
  AdminViewConfig,
  CollectionPreferences,
  CustomComponent,
  DocumentSubViewTypes,
  Payload,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  ViewTypes,
} from 'payload'

import { parseDocumentID } from 'payload'
import { formatAdminURL, isNumber } from 'payload/shared'

import {
  getSubViewActions,
  getViewActions,
} from '../../utilities/routeResolution/attachViewActions.js'
import { getCustomViewByKey } from '../../utilities/routeResolution/getCustomViewByKey.js'
import { getCustomViewByRoute } from '../../utilities/routeResolution/getCustomViewByRoute.js'
import { getDocumentViewInfo } from '../../utilities/routeResolution/getDocumentViewInfo.js'
import { isPathMatchingRoute } from '../../utilities/routeResolution/isPathMatchingRoute.js'

const baseClasses: Record<string, string | undefined> = {
  account: 'account',
  forgot: 'forgot-password',
  login: 'login',
  reset: 'reset-password',
  verify: 'verify',
}

/**
 * Finds a per-collection or per-global custom view whose `path` matches the
 * sub-route under `baseRoute` (e.g. `/collections/posts/my-custom`).
 * Returns the `PayloadComponent` reference + view key, or null if no match.
 */
function findCustomCollectionOrGlobalViewByRoute({
  adminRoute,
  baseRoute,
  currentRoute: currentRouteWithAdmin,
  views,
}: {
  adminRoute: string
  baseRoute: string
  currentRoute: string
  views: SanitizedCollectionConfig['admin']['components']['views']
}): { customViewComponent: PayloadComponent; viewKey: string } | null {
  const currentRoute =
    adminRoute === '/'
      ? currentRouteWithAdmin
      : currentRouteWithAdmin.startsWith(adminRoute)
        ? currentRouteWithAdmin.slice(adminRoute.length)
        : currentRouteWithAdmin

  if (!views || typeof views !== 'object') {
    return null
  }

  const found = Object.entries(views).find(([key, view]) => {
    if (key === 'edit' || key === 'list') {
      return false
    }

    const isAdminViewConfig =
      typeof view === 'object' &&
      view !== null &&
      'path' in view &&
      'Component' in view &&
      typeof (view as { path?: unknown }).path === 'string'

    if (!isAdminViewConfig) {
      return false
    }

    const adminView = view as AdminViewConfig
    const viewPath = `${baseRoute}${adminView.path}`

    return isPathMatchingRoute({
      currentRoute,
      exact: adminView.exact,
      path: viewPath,
      sensitive: adminView.sensitive,
      strict: adminView.strict,
    })
  })

  if (!found) {
    return null
  }

  const [viewKey, foundViewConfig] = found
  const adminView = foundViewConfig as AdminViewConfig

  return {
    customViewComponent: adminView.Component,
    viewKey,
  }
}

/**
 * Result of resolving the current admin URL to view metadata.
 *
 * Framework-agnostic: contains no references to React components. Each adapter
 * uses `viewType` + `routeParams` to dispatch to the shared view RSCs in
 * `@payloadcms/ui/views/*`.
 */
export type GetRouteDataResult = {
  collectionConfig?: SanitizedCollectionConfig
  /**
   * The `PayloadComponent` for a custom view that overrides a built-in view type
   * (e.g. `createFirstUser`). Only set when the config defines a custom component
   * for the matched built-in view key. The adapter resolves it via the importMap.
   */
  customViewComponent?: PayloadComponent
  documentSubViewType?: DocumentSubViewTypes
  globalConfig?: SanitizedGlobalConfig
  hasView: boolean
  routeParams: {
    collection?: string
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

export type GetRouteDataArgs = {
  adminRoute: string
  collectionConfig?: SanitizedCollectionConfig
  /**
   * Collection preferences for folder/hierarchy view detection.
   * Adapter can pre-fetch and pass through.
   */
  collectionPreferences?: CollectionPreferences
  currentRoute: string
  globalConfig?: SanitizedGlobalConfig
  payload: Payload
  searchParams?: { [key: string]: string | string[] }
  segments: string[]
}

/**
 * Resolves the current admin route into framework-agnostic view metadata.
 *
 * Returns `viewType`, template info, route parameters, and (for custom-view
 * overrides) a `customViewComponent` `PayloadComponent` reference. The adapter
 * uses this to drive `renderAdminView` (`@payloadcms/ui/views/Root/renderAdminView`).
 */
export function getRouteData({
  adminRoute,
  collectionConfig,
  collectionPreferences,
  currentRoute,
  globalConfig,
  payload,
  segments,
}: GetRouteDataArgs): GetRouteDataResult {
  const { config } = payload
  let templateClassName: string = ''
  let templateType: 'default' | 'minimal' | undefined
  let documentSubViewType: DocumentSubViewTypes | undefined
  let viewType: undefined | ViewTypes
  let hasView = false
  let customViewComponent: PayloadComponent | undefined
  const routeParams: GetRouteDataResult['routeParams'] = {}

  const [segmentOne, segmentTwo, segmentThree, segmentFour, segmentFive, segmentSix] = segments

  const viewActions: CustomComponent[] = [...(config?.admin?.components?.actions || [])]

  switch (segments.length) {
    case 0: {
      if (currentRoute === adminRoute) {
        templateClassName = 'dashboard'
        templateType = 'default'
        viewType = 'dashboard'
        hasView = true
      }
      break
    }
    case 1: {
      let viewKey: string | undefined

      if (config.admin.routes) {
        const matchedRoute = Object.entries(config.admin.routes).find(([, route]) => {
          return isPathMatchingRoute({
            currentRoute,
            exact: true,
            path: formatAdminURL({ adminRoute, path: route }),
          })
        })

        if (matchedRoute) {
          viewKey = matchedRoute[0]
        }
      }

      const customView =
        (viewKey && getCustomViewByKey({ config, viewKey })) ||
        getCustomViewByRoute({ config, currentRoute })

      if (customView?.view?.payloadComponent || customView?.view?.Component) {
        hasView = true
        viewType = 'custom'
        templateType = 'default'
        customViewComponent = customView.view.payloadComponent ?? undefined
      }

      const oneSegmentViewKeys = [
        'account',
        'createFirstUser',
        'forgot',
        'inactivity',
        'login',
        'logout',
        'unauthorized',
      ]

      if (viewKey && oneSegmentViewKeys.includes(viewKey)) {
        viewType = viewKey as ViewTypes
        templateClassName = baseClasses[viewKey] ?? ''
        templateType = 'minimal'
        hasView = true

        if (viewKey === 'account') {
          templateType = 'default'
        }

        const builtInViewCustomComponent = customView?.view?.payloadComponent
        if (builtInViewCustomComponent) {
          customViewComponent = builtInViewCustomComponent
        }
      }
      break
    }
    case 2: {
      if (`/${segmentOne}` === config.admin.routes.reset) {
        templateClassName = segmentTwo ?? ''
        templateType = 'minimal'
        viewType = 'reset'
        hasView = true
      } else if (collectionConfig) {
        routeParams.collection = collectionConfig.slug

        if (collectionPreferences?.listViewType === 'hierarchy' && collectionConfig.hierarchy) {
          templateClassName = `${segmentTwo}-hierarchy`
          templateType = 'default'
          viewType = 'hierarchy'
        } else {
          templateClassName = `${segmentTwo}-list`
          templateType = 'default'
          viewType = 'list'
        }

        hasView = true
        viewActions.push(...(collectionConfig.admin.components?.views?.list?.actions || []))
      } else if (globalConfig) {
        routeParams.global = globalConfig.slug
        templateClassName = 'global-edit'
        templateType = 'default'
        viewType = 'document'
        hasView = true

        viewActions.push(
          ...getViewActions({
            editConfig: globalConfig.admin?.components?.views?.edit,
            viewKey: 'default',
          }),
        )
      }
      break
    }
    default:
      if (segmentTwo === 'verify') {
        routeParams.collection = segmentOne
        routeParams.token = segmentThree
        templateClassName = 'verify'
        templateType = 'minimal'
        viewType = 'verify'
        hasView = true
      } else if (collectionConfig) {
        routeParams.collection = collectionConfig.slug

        if (segmentThree === 'trash' && typeof segmentFour === 'string') {
          routeParams.id = segmentFour
          routeParams.versionID = segmentSix
          templateClassName = 'collection-default-edit'
          templateType = 'default'

          const viewInfo = getDocumentViewInfo(
            [segmentFive, segmentSix].filter((s): s is string => s != null),
          )
          viewType = viewInfo.viewType
          documentSubViewType = viewInfo.documentSubViewType
          hasView = true

          viewActions.push(
            ...getSubViewActions({
              collectionOrGlobal: collectionConfig,
              viewKeyArg: documentSubViewType,
            }),
          )
        } else if (segmentThree === 'trash') {
          templateClassName = `${segmentTwo}-trash`
          templateType = 'default'
          viewType = 'trash'
          hasView = true

          viewActions.push(...(collectionConfig.admin.components?.views?.list?.actions || []))
        } else if (segmentThree === 'hierarchy' && collectionConfig.hierarchy) {
          templateClassName = `${segmentTwo}-hierarchy`
          templateType = 'default'
          viewType = 'hierarchy'
          hasView = true

          viewActions.push(...(collectionConfig.admin.components?.views?.list?.actions || []))
        } else {
          // Per-collection custom view check: /collections/:slug/:customPath
          const baseRoute = `/${segmentOne}/${segmentTwo}`
          const customCollectionView = findCustomCollectionOrGlobalViewByRoute({
            adminRoute,
            baseRoute,
            currentRoute,
            views: collectionConfig.admin.components?.views,
          })

          if (customCollectionView) {
            customViewComponent = customCollectionView.customViewComponent
            templateClassName = `collection-${customCollectionView.viewKey}`
            templateType = 'default'
            viewType = customCollectionView.viewKey as ViewTypes
            hasView = true
          } else {
            routeParams.id = segmentThree === 'create' ? undefined : segmentThree
            routeParams.versionID = segmentFive
            templateClassName = 'collection-default-edit'
            templateType = 'default'

            const viewInfo = getDocumentViewInfo(
              [segmentFour, segmentFive].filter((s): s is string => s != null),
            )
            viewType = viewInfo.viewType
            documentSubViewType = viewInfo.documentSubViewType
            hasView = true

            viewActions.push(
              ...getSubViewActions({
                collectionOrGlobal: collectionConfig,
                viewKeyArg: documentSubViewType,
              }),
            )
          }
        }
      } else if (globalConfig) {
        // Per-global custom view check: /globals/:slug/:customPath
        const baseRoute = `/${segmentOne}/${segmentTwo}`
        const customGlobalView = findCustomCollectionOrGlobalViewByRoute({
          adminRoute,
          baseRoute,
          currentRoute,
          views: globalConfig.admin.components?.views,
        })

        if (customGlobalView) {
          routeParams.global = globalConfig.slug
          customViewComponent = customGlobalView.customViewComponent
          templateClassName = `global-${customGlobalView.viewKey}`
          templateType = 'default'
          viewType = customGlobalView.viewKey as ViewTypes
          hasView = true
        } else {
          routeParams.global = globalConfig.slug
          routeParams.versionID = segmentFour
          templateClassName = 'global-edit'
          templateType = 'default'

          const viewInfo = getDocumentViewInfo(
            [segmentThree, segmentFour].filter((s): s is string => s != null),
          )
          viewType = viewInfo.viewType
          documentSubViewType = viewInfo.documentSubViewType
          hasView = true

          viewActions.push(
            ...getSubViewActions({
              collectionOrGlobal: globalConfig,
              viewKeyArg: documentSubViewType,
            }),
          )
        }
      }
      break
  }

  if (!hasView) {
    const customView = getCustomViewByRoute({ config, currentRoute })
    if (customView?.view?.payloadComponent || customView?.view?.Component) {
      hasView = true
      viewType = 'custom'
      templateType = templateType || 'default'
      customViewComponent = customView.view.payloadComponent ?? customViewComponent
    }
  }

  if (collectionConfig) {
    if (routeParams.id) {
      routeParams.id = parseDocumentID({
        id: routeParams.id,
        collectionSlug: collectionConfig.slug,
        payload,
      })
    }

    if (routeParams.versionID) {
      routeParams.versionID = parseDocumentID({
        id: routeParams.versionID,
        collectionSlug: collectionConfig.slug,
        payload,
      })
    }
  }

  if (globalConfig && routeParams.versionID) {
    routeParams.versionID =
      payload.db.defaultIDType === 'number' && isNumber(routeParams.versionID)
        ? Number(routeParams.versionID)
        : routeParams.versionID
  }

  if (viewActions.length) {
    viewActions.reverse()
  }

  return {
    collectionConfig,
    customViewComponent,
    documentSubViewType,
    globalConfig,
    hasView,
    routeParams,
    templateClassName,
    templateType,
    viewActions: viewActions.length ? viewActions : undefined,
    viewType,
  }
}
