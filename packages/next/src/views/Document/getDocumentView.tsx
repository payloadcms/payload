import type {
  Data,
  PayloadComponent,
  PayloadRequest,
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
import { UnauthorizedViewWithGutter } from '../Unauthorized/index.js'
import { VersionView as DefaultVersionView } from '../Version/index.js'
import { VersionsView as DefaultVersionsView } from '../Versions/index.js'
import { getCustomViewByKey } from './getCustomViewByKey.js'
import { getCustomViewByRoute } from './getCustomViewByRoute.js'
import { getViewCondition } from './getViewCondition.js'

export type ViewFromConfig<TProps extends object> = {
  Component?: React.FC<TProps>
  ComponentConfig?: PayloadComponent<TProps>
}

export const getDocumentView = ({
  collectionConfig,
  config,
  doc,
  docPermissions,
  globalConfig,
  req,
  routeSegments,
}: {
  collectionConfig?: SanitizedCollectionConfig
  config: SanitizedConfig
  doc: Data
  docPermissions: SanitizedCollectionPermission | SanitizedGlobalPermission
  globalConfig?: SanitizedGlobalConfig
  req?: PayloadRequest
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

  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  const viewCondition = (viewKey: string): boolean => {
    const conditionResult = getViewCondition({
      name: viewKey,
      collectionConfig,
      doc,
      globalConfig,
      req,
    })

    if (conditionResult) {
      return true
    }
    return false
  }

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
              View = getCustomViewByKey(views, 'default') || DefaultEditView
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
              View = getCustomViewByKey(views, 'default') || DefaultEditView
            }

            break
          }
        }
        break
      }

      // --> /collections/:collectionSlug/:id/api
      // --> /collections/:collectionSlug/:id/preview
      // --> /collections/:collectionSlug/:id/versions
      // --> /collections/:collectionSlug/:id/<custom-segment>
      case 4: {
        switch (segment4) {
          // --> /collections/:collectionSlug/:id/api
          case 'api': {
            const passesCondition = viewCondition('api')
            if (passesCondition && collectionConfig?.admin?.hideAPIURL !== true) {
              View = getCustomViewByKey(views, 'api') || DefaultAPIView
            }
            break
          }

          case 'preview': {
            // --> /collections/:collectionSlug/:id/preview

            const passesCondition = viewCondition('preview')
            if (
              (passesCondition && collectionConfig && collectionConfig?.admin?.livePreview) ||
              config?.admin?.livePreview?.collections?.includes(collectionConfig?.slug)
            ) {
              View = getCustomViewByKey(views, 'livePreview') || DefaultLivePreviewView
            }
            break
          }

          case 'versions': {
            // --> /collections/:collectionSlug/:id/versions
            const passesCondition = viewCondition('versions')
            if (passesCondition && docPermissions?.readVersions) {
              View = getCustomViewByKey(views, 'versions') || DefaultVersionsView
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

      // --> /collections/:collectionSlug/:id/versions/:version
      // --> /collections/:collectionSlug/:id/<custom-segment>/<custom-segment>
      default: {
        // --> /collections/:collectionSlug/:id/versions/:version
        if (segment4 === 'versions') {

          const passesCondition = viewCondition('versions')
          if (passesCondition && docPermissions?.readVersions) {
            View = getCustomViewByKey(views, 'version') || DefaultVersionView
          } else {
            View = UnauthorizedViewWithGutter
          }
        } else {
          // --> /collections/:collectionSlug/:id/<custom-segment>/<custom-segment>
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
        View = getCustomViewByKey(views, 'default') || DefaultEditView
        break
      }

      case 3: {
        // --> /globals/:globalSlug/api
        // --> /globals/:globalSlug/preview
        // --> /globals/:globalSlug/versions
        // --> /globals/:globalSlug/<custom-segment>
        switch (segment3) {
          // --> /globals/:globalSlug/api
          case 'api': {
            const passesCondition = viewCondition('api')
            if (passesCondition && globalConfig?.admin?.hideAPIURL !== true) {
              View = getCustomViewByKey(views, 'api') || DefaultAPIView
            }

            break
          }

          case 'preview': {
            // --> /globals/:globalSlug/preview
            const passesCondition = viewCondition('preview')
            if (
              (passesCondition && (globalConfig && globalConfig?.admin?.livePreview) ||
                config?.admin?.livePreview?.globals?.includes(globalConfig?.slug))
            ) {
              View = getCustomViewByKey(views, 'livePreview') || DefaultLivePreviewView
            }

            break
          }

          case 'versions': {
            // --> /globals/:globalSlug/versions
            const passesCondition = viewCondition('versions')
            if (passesCondition && docPermissions?.readVersions) {
              View = getCustomViewByKey(views, 'versions') || DefaultVersionsView
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
            View = getCustomViewByKey(views, 'version') || DefaultVersionView
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
