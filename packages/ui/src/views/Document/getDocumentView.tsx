import type {
  EditViewComponent,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'
import type React from 'react'

import { APIView as DefaultAPIView } from '../API/index.js'
import { DefaultEditView } from '../Edit/index.js'
import { UnauthorizedViewWithGutter } from '../Unauthorized/index.js'
import { getCustomDocumentViewByKey } from './getCustomDocumentViewByKey.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'

export type DocumentViewToRender =
  | EditViewComponent
  | null
  | PayloadComponent
  | React.FC
  | React.FC<any>

export type DefaultDocumentViews = {
  api?: DocumentViewToRender
  edit?: DocumentViewToRender
  version?: DocumentViewToRender
  versions?: DocumentViewToRender
}

export const getDocumentView = ({
  collectionConfig,
  config,
  defaultViews,
  docPermissions,
  globalConfig,
  routeSegments,
}: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  defaultViews?: DefaultDocumentViews
  docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission
  globalConfig?: SanitizedGlobalConfig
  routeSegments: string[]
}): {
  View: DocumentViewToRender
  viewKey: string
} | null => {
  const FallbackEditView = defaultViews?.edit || DefaultEditView
  const FallbackAPIView = defaultViews?.api || DefaultAPIView
  const FallbackVersionView = defaultViews?.version || null
  const FallbackVersionsView = defaultViews?.versions || null

  let View: DocumentViewToRender = null
  let viewKey: string

  const {
    routes: { admin: adminRoute },
  } = config

  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  if (!docPermissions?.read) {
    throw new Error('not-found')
  }

  if (collectionConfig) {
    const [collectionEntity, collectionSlug, segment3, segment4, segment5, ...remainingSegments] =
      routeSegments

    switch (routeSegments.length) {
      case 3: {
        switch (segment3) {
          case 'create': {
            if ('create' in docPermissions && docPermissions.create) {
              View = getCustomDocumentViewByKey(views, 'default') || FallbackEditView
            } else {
              View = UnauthorizedViewWithGutter
            }
            break
          }

          default: {
            const baseRoute = [
              adminRoute !== '/' && adminRoute,
              'collections',
              collectionSlug,
              segment3,
            ]
              .filter(Boolean)
              .join('/')

            const currentRoute = [baseRoute, segment4, segment5, ...remainingSegments]
              .filter(Boolean)
              .join('/')

            const { Component: CustomViewComponent, viewKey: customViewKey } = getCustomViewByRoute(
              {
                baseRoute,
                currentRoute,
                views,
              },
            )

            if (customViewKey) {
              viewKey = customViewKey
              View = CustomViewComponent
            } else {
              View = getCustomDocumentViewByKey(views, 'default') || FallbackEditView
            }

            break
          }
        }
        break
      }

      case 4: {
        if (segment3 === 'trash' && segment4) {
          View = getCustomDocumentViewByKey(views, 'default') || FallbackEditView
          break
        }
        switch (segment4) {
          case 'api': {
            View = getCustomDocumentViewByKey(views, 'api') || FallbackAPIView
            break
          }

          case 'versions': {
            if (docPermissions?.readVersions) {
              View = getCustomDocumentViewByKey(views, 'versions') || FallbackVersionsView
            } else {
              View = UnauthorizedViewWithGutter
            }
            break
          }

          default: {
            const baseRoute = [
              adminRoute !== '/' && adminRoute,
              'collections',
              collectionSlug,
              segment3,
            ]
              .filter(Boolean)
              .join('/')

            const currentRoute = [baseRoute, segment4, segment5, ...remainingSegments]
              .filter(Boolean)
              .join('/')

            const { Component: CustomViewComponent, viewKey: customViewKey } = getCustomViewByRoute(
              {
                baseRoute,
                currentRoute,
                views,
              },
            )

            if (customViewKey) {
              viewKey = customViewKey
              View = CustomViewComponent
            }

            break
          }
        }
        break
      }

      case 5: {
        if (segment3 === 'trash') {
          switch (segment5) {
            case 'api': {
              View = getCustomDocumentViewByKey(views, 'api') || FallbackAPIView
              break
            }
            case 'versions': {
              if (docPermissions?.readVersions) {
                View = getCustomDocumentViewByKey(views, 'versions') || FallbackVersionsView
              } else {
                View = UnauthorizedViewWithGutter
              }
              break
            }

            default: {
              View = getCustomDocumentViewByKey(views, 'default') || FallbackEditView
              break
            }
          }
        } else if (segment4 === 'versions') {
          if (docPermissions?.readVersions) {
            View = getCustomDocumentViewByKey(views, 'version') || FallbackVersionView
          } else {
            View = UnauthorizedViewWithGutter
          }
        } else {
          const baseRoute = [
            adminRoute !== '/' && adminRoute,
            collectionEntity,
            collectionSlug,
            segment3,
          ]
            .filter(Boolean)
            .join('/')

          const currentRoute = [baseRoute, segment4, segment5, ...remainingSegments]
            .filter(Boolean)
            .join('/')

          const { Component: CustomViewComponent, viewKey: customViewKey } = getCustomViewByRoute({
            baseRoute,
            currentRoute,
            views,
          })

          if (customViewKey) {
            viewKey = customViewKey
            View = CustomViewComponent
          }
        }

        break
      }

      default: {
        const isTrashedVersionView = segment3 === 'trash' && segment5 === 'versions'

        if (isTrashedVersionView) {
          if (docPermissions?.readVersions) {
            View = getCustomDocumentViewByKey(views, 'version') || FallbackVersionView
          } else {
            View = UnauthorizedViewWithGutter
          }
        } else {
          const baseRoute = [
            adminRoute !== '/' && adminRoute,
            collectionEntity,
            collectionSlug,
            segment3,
          ]
            .filter(Boolean)
            .join('/')

          const currentRoute = [baseRoute, segment4, segment5, ...remainingSegments]
            .filter(Boolean)
            .join('/')

          const { Component: CustomViewComponent, viewKey: customViewKey } = getCustomViewByRoute({
            baseRoute,
            currentRoute,
            views,
          })

          if (customViewKey) {
            viewKey = customViewKey
            View = CustomViewComponent
          }
        }

        break
      }
    }
  }

  if (globalConfig) {
    const [globalEntity, globalSlug, segment3, ...remainingSegments] = routeSegments

    switch (routeSegments.length) {
      case 2: {
        View = getCustomDocumentViewByKey(views, 'default') || FallbackEditView
        break
      }

      case 3: {
        switch (segment3) {
          case 'api': {
            View = getCustomDocumentViewByKey(views, 'api') || FallbackAPIView
            break
          }

          case 'versions': {
            if (docPermissions?.readVersions) {
              View = getCustomDocumentViewByKey(views, 'versions') || FallbackVersionsView
            } else {
              View = UnauthorizedViewWithGutter
            }
            break
          }

          default: {
            if (docPermissions?.read) {
              const baseRoute = [adminRoute, globalEntity, globalSlug, segment3]
                .filter(Boolean)
                .join('/')

              const currentRoute = [baseRoute, segment3, ...remainingSegments]
                .filter(Boolean)
                .join('/')

              const { Component: CustomViewComponent, viewKey: customViewKey } =
                getCustomViewByRoute({
                  baseRoute,
                  currentRoute,
                  views,
                })

              if (customViewKey) {
                viewKey = customViewKey

                View = CustomViewComponent
              } else {
                View = FallbackEditView
              }
            } else {
              View = UnauthorizedViewWithGutter
            }
            break
          }
        }
        break
      }

      default: {
        if (segment3 === 'versions') {
          if (docPermissions?.readVersions) {
            View = getCustomDocumentViewByKey(views, 'version') || FallbackVersionView
          } else {
            View = UnauthorizedViewWithGutter
          }
        } else {
          const baseRoute = [adminRoute !== '/' && adminRoute, 'globals', globalSlug]
            .filter(Boolean)
            .join('/')

          const currentRoute = [baseRoute, segment3, ...remainingSegments].filter(Boolean).join('/')

          const { Component: CustomViewComponent, viewKey: customViewKey } = getCustomViewByRoute({
            baseRoute,
            currentRoute,
            views,
          })

          if (customViewKey) {
            viewKey = customViewKey
            View = CustomViewComponent
          }
        }

        break
      }
    }
  }

  return {
    View,
    viewKey,
  }
}
