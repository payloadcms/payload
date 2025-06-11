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

import { APIView as DefaultAPIView } from '../API/index.js'
import { EditView as DefaultEditView } from '../Edit/index.js'
import { LivePreviewView as DefaultLivePreviewView } from '../LivePreview/index.js'
import { UnauthorizedView } from '../Unauthorized/index.js'
import { VersionView as DefaultVersionView } from '../Version/index.js'
import { VersionsView as DefaultVersionsView } from '../Versions/index.js'
import { getCustomViewByKey } from './getCustomViewByKey.js'
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
  overrideDocPermissions,
  routeSegments,
}: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  globalConfig?: SanitizedGlobalConfig
  routeSegments: string[]
} & (
  | {
      docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission
      overrideDocPermissions?: false | undefined
    }
  | {
      docPermissions?: never
      overrideDocPermissions: true
    }
)): {
  View: ViewToRender
  viewKey: string
} | null => {
  // Conditionally import and lazy load the default view
  let View: ViewToRender = null
  let viewKey: string

  const {
    routes: { admin: adminRoute },
  } = config

  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  if (!overrideDocPermissions && !docPermissions?.read) {
    throw new Error('not-found')
  }

  if (collectionConfig) {
    const [collectionEntity, collectionSlug, segment3, segment4, segment5, ...remainingSegments] =
      routeSegments

    // --> ../:id
    // --> ../create
    switch (routeSegments.length) {
      case 3: {
        switch (segment3) {
          // --> ../create
          case 'create': {
            if (!overrideDocPermissions && 'create' in docPermissions && docPermissions.create) {
              View = getCustomViewByKey(views, 'default') || DefaultEditView
            } else {
              View = UnauthorizedView
            }
            break
          }

          // --> ../:id
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
              View = getCustomViewByKey(views, 'default') || DefaultEditView
            }

            break
          }
        }
        break
      }

      // --> ../:id/api
      // --> ../:id/preview
      // --> ../:id/versions
      // --> ../:id/<custom-segment>
      case 4: {
        switch (segment4) {
          // --> ../:id/api
          case 'api': {
            if (collectionConfig?.admin?.hideAPIURL !== true) {
              View = getCustomViewByKey(views, 'api') || DefaultAPIView
            }
            break
          }

          case 'preview': {
            // --> ../:id/preview
            if (
              (collectionConfig && collectionConfig?.admin?.livePreview) ||
              config?.admin?.livePreview?.collections?.includes(collectionConfig?.slug)
            ) {
              View = getCustomViewByKey(views, 'livePreview') || DefaultLivePreviewView
            }
            break
          }

          case 'versions': {
            // --> ../:id/versions
            if (!overrideDocPermissions && docPermissions?.readVersions) {
              View = getCustomViewByKey(views, 'versions') || DefaultVersionsView
            } else {
              View = UnauthorizedView
            }
            break
          }

          // --> ../:id/<custom-segment>
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

      // --> ../:id/versions/:version
      // --> ../:id/<custom-segment>/<custom-segment>
      default: {
        // --> ../:id/versions/:version
        if (segment4 === 'versions') {
          if (!overrideDocPermissions && docPermissions?.readVersions) {
            View = getCustomViewByKey(views, 'version') || DefaultVersionView
          } else {
            View = UnauthorizedView
          }
        } else {
          // --> ../:id/<custom-segment>/<custom-segment>
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
      // --> ../:slug
      case 2: {
        View = getCustomViewByKey(views, 'default') || DefaultEditView
        break
      }

      case 3: {
        // --> ../:slug/api
        // --> ../:slug/preview
        // --> ../:slug/versions
        // --> ../:slug/<custom-segment>
        switch (segment3) {
          // --> ../:slug/api
          case 'api': {
            if (globalConfig?.admin?.hideAPIURL !== true) {
              View = getCustomViewByKey(views, 'api') || DefaultAPIView
            }

            break
          }

          case 'preview': {
            // --> ../:slug/preview
            if (
              (globalConfig && globalConfig?.admin?.livePreview) ||
              config?.admin?.livePreview?.globals?.includes(globalConfig?.slug)
            ) {
              View = getCustomViewByKey(views, 'livePreview') || DefaultLivePreviewView
            }

            break
          }

          case 'versions': {
            // --> ../:slug/versions
            if (!overrideDocPermissions && docPermissions?.readVersions) {
              View = getCustomViewByKey(views, 'versions') || DefaultVersionsView
            } else {
              View = UnauthorizedView
            }
            break
          }

          // --> ../:slug/<custom-segment>
          default: {
            if (!overrideDocPermissions && docPermissions?.read) {
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
              View = UnauthorizedView
            }
            break
          }
        }
        break
      }

      // --> ../:slug/versions/:version
      // --> ../:slug/<custom-segment>/<custom-segment>
      default: {
        // --> ../:slug/versions/:version
        if (segment3 === 'versions') {
          if (!overrideDocPermissions && docPermissions?.readVersions) {
            View = getCustomViewByKey(views, 'version') || DefaultVersionView
          } else {
            View = UnauthorizedView
          }
        } else {
          // --> ../:slug/<custom-segment>/<custom-segment>
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
