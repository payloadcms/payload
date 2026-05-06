import type { ViewFromConfig } from '@payloadcms/ui/utilities/routeResolution'
import type {
  CollectionPreferences,
  CustomComponent,
  DocumentSubViewTypes,
  Payload,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedGlobalConfig,
  ViewTypes,
} from 'payload'

import {
  getCustomViewByKey,
  getCustomViewByRoute,
  getDocumentViewInfo,
  getSubViewActions,
  getViewActions,
  isPathMatchingRoute,
} from '@payloadcms/ui/utilities/routeResolution'
import { parseDocumentID } from 'payload'
import { formatAdminURL, isNumber } from 'payload/shared'

export type { ViewFromConfig }

const baseClasses: Record<string, string | undefined> = {
  account: 'account',
  forgot: 'forgot-password',
  login: 'login',
  reset: 'reset-password',
  verify: 'verify',
}

export type GetRouteDataResult = {
  collectionConfig?: SanitizedCollectionConfig
  /**
   * The PayloadComponent for a custom view that overrides a built-in view type (e.g. createFirstUser).
   * Only set when the config defines a custom component for the matched built-in view key.
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

type GetRouteDataArgs = {
  adminRoute: string
  collectionConfig?: SanitizedCollectionConfig
  collectionPreferences?: CollectionPreferences
  currentRoute: string
  globalConfig?: SanitizedGlobalConfig
  payload: Payload
  searchParams: { [key: string]: string | string[] }
  segments: string[]
}

/**
 * Resolves the current admin route into view metadata.
 * Adapted from the Next.js `getRouteData` but without referencing RSC view components.
 * Returns view type, template info, and route parameters for client-side rendering.
 */
export function getRouteData({
  adminRoute,
  collectionConfig,
  collectionPreferences = undefined,
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
      } else if (globalConfig) {
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

  // Filter out Next.js-only server actions that rely on next/headers or
  // next/navigation and would crash when rendered as React components in the
  // TanStack client runtime (e.g. `GlobalViewRedirect` from the multi-tenant
  // plugin — it's a server-side async redirect helper, not a client component).
  const filteredViewActions = viewActions.filter((action) => {
    const path = typeof action === 'object' && action ? (action as { path?: string }).path : action
    if (typeof path !== 'string') {
      return true
    }
    return !NEXT_ONLY_SERVER_COMPONENT_PATHS.some((pattern) => path.includes(pattern))
  })

  if (filteredViewActions.length) {
    filteredViewActions.reverse()
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
    viewActions: filteredViewActions.length ? filteredViewActions : undefined,
    viewType,
  }
}

/**
 * Component paths whose implementations use Next.js-only APIs
 * (`next/headers`, `next/navigation`) and cannot be rendered in TanStack Start.
 * These are filtered out of viewActions to prevent client-side crashes; their
 * server-side behavior (if any) must be re-implemented via the route loader.
 */
const NEXT_ONLY_SERVER_COMPONENT_PATHS = ['@payloadcms/plugin-multi-tenant/rsc#GlobalViewRedirect']
