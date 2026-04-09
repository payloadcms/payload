import type { ViewFromConfig } from '@payloadcms/ui/utilities/routeResolution'
import type {
  CollectionPreferences,
  CollectionSlug,
  CustomComponent,
  DocumentSubViewTypes,
  Payload,
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
  folders: 'folders',
  forgot: 'forgot-password',
  login: 'login',
  reset: 'reset-password',
  verify: 'verify',
}

export type GetRouteDataResult = {
  browseByFolderSlugs: CollectionSlug[]
  collectionConfig?: SanitizedCollectionConfig
  documentSubViewType?: DocumentSubViewTypes
  globalConfig?: SanitizedGlobalConfig
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
  const routeParams: GetRouteDataResult['routeParams'] = {}

  const [segmentOne, segmentTwo, segmentThree, segmentFour, segmentFive, segmentSix] = segments

  const isBrowseByFolderEnabled = config.folders && config.folders.browseByFolder
  const browseByFolderSlugs =
    (isBrowseByFolderEnabled &&
      config.collections.reduce((acc, { slug, folders }) => {
        if (folders && folders.browseByFolder) {
          return [...acc, slug]
        }
        return acc
      }, [] as CollectionSlug[])) ||
    []

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
      }

      const oneSegmentViewKeys = [
        'account',
        'browseByFolder',
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

        if (isBrowseByFolderEnabled && viewKey === 'browseByFolder') {
          templateType = 'default'
          viewType = 'folders'
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
      } else if (
        isBrowseByFolderEnabled &&
        `/${segmentOne}` === config.admin.routes.browseByFolder
      ) {
        routeParams.folderID = segmentTwo
        templateClassName = 'folders'
        templateType = 'default'
        viewType = 'folders'
        hasView = true
      } else if (collectionConfig) {
        routeParams.collection = collectionConfig.slug

        if (
          collectionPreferences?.listViewType &&
          collectionPreferences.listViewType === 'folders'
        ) {
          templateClassName = 'collection-folders'
          templateType = 'default'
          viewType = 'collection-folders'
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
        } else {
          if (config.folders && segmentThree === config.folders.slug && collectionConfig.folders) {
            routeParams.folderCollection = segmentThree
            routeParams.folderID = segmentFour
            templateClassName = 'collection-folders'
            templateType = 'default'
            viewType = 'collection-folders'
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
    if (customView?.view) {
      hasView = true
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

  if (config.folders && routeParams.folderID) {
    routeParams.folderID = parseDocumentID({
      id: routeParams.folderID,
      collectionSlug: config.folders.slug,
      payload,
    })
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
    browseByFolderSlugs,
    collectionConfig,
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
