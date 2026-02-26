import type {
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'
import type React from 'react'

import type { ViewToRender } from './index.js'

import { getAdminConfig } from '../../utilities/adminConfigCache.js'
import { APIView as DefaultAPIView } from '../API/index.js'
import { EditView as DefaultEditView } from '../Edit/index.js'
import { UnauthorizedViewWithGutter } from '../Unauthorized/index.js'
import { VersionView as DefaultVersionView } from '../Version/index.js'
import { VersionsView as DefaultVersionsView } from '../Versions/index.js'
import { getCustomDocumentViewByKey } from './getCustomDocumentViewByKey.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'

export type ViewFromConfig<TProps extends object> = {
  Component?: React.FC<TProps>
  ComponentConfig?: PayloadComponent<TProps>
}

export const getDocumentView = ({
  collectionConfig,
  config,
  docPermissions,
  globalConfig,
  routeSegments,
}: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission
  globalConfig?: SanitizedGlobalConfig
  routeSegments: string[]
}): {
  View: ViewToRender
  viewKey: string
} | null => {
  // Conditionally import and lazy load the default view
  let View: ViewToRender = null
  let viewKey: string

  const {
    routes: { admin: adminRoute },
  } = config

  const adminConfig = getAdminConfig()
  const slug = collectionConfig?.slug ?? globalConfig?.slug
  const adminEntityViews = slug
    ? ((collectionConfig ? adminConfig.collections?.[slug] : adminConfig.globals?.[slug]) as any)
        ?.views
    : undefined

  const views =
    adminEntityViews ||
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  if (!docPermissions?.read) {
    throw new Error('not-found')
  }

  if (collectionConfig) {
    const [collectionEntity, collectionSlug, segment3, segment4, segment5, ...remainingSegments] =
      routeSegments

    // --> /collections/:collectionSlug/:id
    // --> /collections/:collectionSlug/create
    switch (routeSegments.length) {
      case 3: {
        switch (segment3) {
          // --> /collections/:collectionSlug/create
          case 'create': {
            if ('create' in docPermissions && docPermissions.create) {
              View = getCustomDocumentViewByKey(views, 'default') || DefaultEditView
            } else {
              View = UnauthorizedViewWithGutter
            }
            break
          }

          // --> /collections/:collectionSlug/:id
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
              View = getCustomDocumentViewByKey(views, 'default') || DefaultEditView
            }

            break
          }
        }
        break
      }

      // --> /collections/:collectionSlug/:id/api
      // --> /collections/:collectionSlug/:id/versions
      // --> /collections/:collectionSlug/:id/<custom-segment>
      // --> /collections/:collectionSlug/trash/:id
      case 4: {
        // --> /collections/:collectionSlug/trash/:id
        if (segment3 === 'trash' && segment4) {
          View = getCustomDocumentViewByKey(views, 'default') || DefaultEditView
          break
        }
        switch (segment4) {
          // --> /collections/:collectionSlug/:id/api
          case 'api': {
            if (collectionConfig?.admin?.hideAPIURL !== true) {
              View = getCustomDocumentViewByKey(views, 'api') || DefaultAPIView
            }
            break
          }

          case 'versions': {
            // --> /collections/:collectionSlug/:id/versions
            if (docPermissions?.readVersions) {
              View = getCustomDocumentViewByKey(views, 'versions') || DefaultVersionsView
            } else {
              View = UnauthorizedViewWithGutter
            }
            break
          }

          // --> /collections/:collectionSlug/:id/<custom-segment>
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

      // --> /collections/:collectionSlug/trash/:id/api
      // --> /collections/:collectionSlug/trash/:id/versions
      // --> /collections/:collectionSlug/trash/:id/<custom-segment>
      // --> /collections/:collectionSlug/:id/versions/:version
      case 5: {
        // --> /collections/:slug/trash/:id/api
        if (segment3 === 'trash') {
          switch (segment5) {
            case 'api': {
              if (collectionConfig?.admin?.hideAPIURL !== true) {
                View = getCustomDocumentViewByKey(views, 'api') || DefaultAPIView
              }
              break
            }
            // --> /collections/:slug/trash/:id/versions
            case 'versions': {
              if (docPermissions?.readVersions) {
                View = getCustomDocumentViewByKey(views, 'versions') || DefaultVersionsView
              } else {
                View = UnauthorizedViewWithGutter
              }
              break
            }

            default: {
              View = getCustomDocumentViewByKey(views, 'default') || DefaultEditView
              break
            }
          }
          // --> /collections/:collectionSlug/:id/versions/:version
        } else if (segment4 === 'versions') {
          if (docPermissions?.readVersions) {
            View = getCustomDocumentViewByKey(views, 'version') || DefaultVersionView
          } else {
            View = UnauthorizedViewWithGutter
          }
        } else {
          // --> /collections/:collectionSlug/:id/<custom>/<custom>
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

      // --> /collections/:collectionSlug/trash/:id/versions/:version
      // --> /collections/:collectionSlug/:id/<custom>/<custom>/<custom...>
      default: {
        // --> /collections/:collectionSlug/trash/:id/versions/:version
        const isTrashedVersionView = segment3 === 'trash' && segment5 === 'versions'

        if (isTrashedVersionView) {
          if (docPermissions?.readVersions) {
            View = getCustomDocumentViewByKey(views, 'version') || DefaultVersionView
          } else {
            View = UnauthorizedViewWithGutter
          }
        } else {
          // --> /collections/:collectionSlug/:id/<custom>/<custom>/<custom...>
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
      // --> /globals/:globalSlug
      case 2: {
        View = getCustomDocumentViewByKey(views, 'default') || DefaultEditView
        break
      }

      case 3: {
        // --> /globals/:globalSlug/api
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/<custom-segment>
        switch (segment3) {
          // --> /globals/:globalSlug/api
          case 'api': {
            if (globalConfig?.admin?.hideAPIURL !== true) {
              View = getCustomDocumentViewByKey(views, 'api') || DefaultAPIView
            }

            break
          }

          case 'versions': {
            // --> /globals/:globalSlug/versions
            if (docPermissions?.readVersions) {
              View = getCustomDocumentViewByKey(views, 'versions') || DefaultVersionsView
            } else {
              View = UnauthorizedViewWithGutter
            }
            break
          }

          // --> /globals/:globalSlug/<custom-segment>
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
                View = DefaultEditView
              }
            } else {
              View = UnauthorizedViewWithGutter
            }
            break
          }
        }
        break
      }

      // --> /globals/:globalSlug/versions/:version
      // --> /globals/:globalSlug/<custom-segment>/<custom-segment>
      default: {
        // --> /globals/:globalSlug/versions/:version
        if (segment3 === 'versions') {
          if (docPermissions?.readVersions) {
            View = getCustomDocumentViewByKey(views, 'version') || DefaultVersionView
          } else {
            View = UnauthorizedViewWithGutter
          }
        } else {
          // --> /globals/:globalSlug/<custom-segment>/<custom-segment>
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
