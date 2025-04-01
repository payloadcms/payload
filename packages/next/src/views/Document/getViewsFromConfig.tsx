import type {
  AdminViewServerProps,
  DocumentViewServerProps,
  PayloadComponent,
  SanitizedCollectionConfig,
  SanitizedCollectionPermission,
  SanitizedConfig,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'
import type React from 'react'

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

export const getViewsFromConfig = ({
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
  CustomView: ViewFromConfig<DocumentViewServerProps>
  DefaultView: ViewFromConfig<DocumentViewServerProps>
  /**
   * The error view to display if CustomView or DefaultView do not exist (could be either due to not found, or unauthorized). Can be null
   */
  ErrorView: ViewFromConfig<AdminViewServerProps>
  viewKey: string
} | null => {
  // Conditionally import and lazy load the default view
  let DefaultView: ViewFromConfig<DocumentViewServerProps> = null
  let CustomView: ViewFromConfig<DocumentViewServerProps> = null
  let ErrorView: ViewFromConfig<AdminViewServerProps> = null
  let viewKey: string

  const {
    routes: { admin: adminRoute },
  } = config

  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  const livePreviewEnabled =
    (collectionConfig && collectionConfig?.admin?.livePreview) ||
    config?.admin?.livePreview?.collections?.includes(collectionConfig?.slug) ||
    (globalConfig && globalConfig?.admin?.livePreview) ||
    config?.admin?.livePreview?.globals?.includes(globalConfig?.slug)

  if (collectionConfig) {
    const [collectionEntity, collectionSlug, segment3, segment4, segment5, ...remainingSegments] =
      routeSegments

    if (!overrideDocPermissions && !docPermissions?.read) {
      throw new Error('not-found')
    } else {
      // `../:id`, or `../create`
      switch (routeSegments.length) {
        case 3: {
          switch (segment3) {
            case 'create': {
              if (!overrideDocPermissions && 'create' in docPermissions && docPermissions.create) {
                CustomView = {
                  ComponentConfig: getCustomViewByKey(views, 'default'),
                }
                DefaultView = {
                  Component: DefaultEditView,
                }
              } else {
                ErrorView = {
                  Component: UnauthorizedView,
                }
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

              const { Component: CustomViewComponent, viewKey: customViewKey } =
                getCustomViewByRoute({
                  baseRoute,
                  currentRoute,
                  views,
                })

              if (customViewKey) {
                viewKey = customViewKey

                CustomView = {
                  ComponentConfig: CustomViewComponent,
                }
              } else {
                CustomView = {
                  ComponentConfig: getCustomViewByKey(views, 'default'),
                }

                DefaultView = {
                  Component: DefaultEditView,
                }
              }

              break
            }
          }
          break
        }

        // `../:id/api`, `../:id/preview`, `../:id/versions`, etc
        case 4: {
          switch (segment4) {
            case 'api': {
              if (collectionConfig?.admin?.hideAPIURL !== true) {
                CustomView = {
                  ComponentConfig: getCustomViewByKey(views, 'api'),
                }
                DefaultView = {
                  Component: DefaultAPIView,
                }
              }
              break
            }

            case 'preview': {
              if (livePreviewEnabled) {
                DefaultView = {
                  Component: DefaultLivePreviewView,
                }
                CustomView = {
                  ComponentConfig: getCustomViewByKey(views, 'livePreview'),
                }
              }
              break
            }

            case 'versions': {
              if (!overrideDocPermissions && docPermissions?.readVersions) {
                CustomView = {
                  ComponentConfig: getCustomViewByKey(views, 'versions'),
                }
                DefaultView = {
                  Component: DefaultVersionsView,
                }
              } else {
                ErrorView = {
                  Component: UnauthorizedView,
                }
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

              const { Component: CustomViewComponent, viewKey: customViewKey } =
                getCustomViewByRoute({
                  baseRoute,
                  currentRoute,
                  views,
                })

              if (customViewKey) {
                viewKey = customViewKey

                CustomView = {
                  ComponentConfig: CustomViewComponent,
                }
              }

              break
            }
          }
          break
        }

        // `../:id/versions/:version`, etc
        default: {
          if (segment4 === 'versions') {
            if (!overrideDocPermissions && docPermissions?.readVersions) {
              CustomView = {
                ComponentConfig: getCustomViewByKey(views, 'version'),
              }
              DefaultView = {
                Component: DefaultVersionView,
              }
            } else {
              ErrorView = {
                Component: UnauthorizedView,
              }
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

            const { Component: CustomViewComponent, viewKey: customViewKey } = getCustomViewByRoute(
              {
                baseRoute,
                currentRoute,
                views,
              },
            )

            if (customViewKey) {
              viewKey = customViewKey

              CustomView = {
                ComponentConfig: CustomViewComponent,
              }
            }
          }

          break
        }
      }
    }
  }

  if (globalConfig) {
    const [globalEntity, globalSlug, segment3, ...remainingSegments] = routeSegments

    if (!overrideDocPermissions && !docPermissions?.read) {
      throw new Error('not-found')
    } else {
      switch (routeSegments.length) {
        case 2: {
          CustomView = {
            ComponentConfig: getCustomViewByKey(views, 'default'),
          }
          DefaultView = {
            Component: DefaultEditView,
          }
          break
        }

        case 3: {
          // `../:slug/api`, `../:slug/preview`, `../:slug/versions`, etc
          switch (segment3) {
            case 'api': {
              if (globalConfig?.admin?.hideAPIURL !== true) {
                CustomView = {
                  ComponentConfig: getCustomViewByKey(views, 'api'),
                }
                DefaultView = {
                  Component: DefaultAPIView,
                }
              }
              break
            }

            case 'preview': {
              if (livePreviewEnabled) {
                DefaultView = {
                  Component: DefaultLivePreviewView,
                }
                CustomView = {
                  ComponentConfig: getCustomViewByKey(views, 'livePreview'),
                }
              }
              break
            }

            case 'versions': {
              if (!overrideDocPermissions && docPermissions?.readVersions) {
                CustomView = {
                  ComponentConfig: getCustomViewByKey(views, 'versions'),
                }

                DefaultView = {
                  Component: DefaultVersionsView,
                }
              } else {
                ErrorView = {
                  Component: UnauthorizedView,
                }
              }
              break
            }

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

                  CustomView = {
                    ComponentConfig: CustomViewComponent,
                  }
                } else {
                  DefaultView = {
                    Component: DefaultEditView,
                  }
                }
              } else {
                ErrorView = {
                  Component: UnauthorizedView,
                }
              }
              break
            }
          }
          break
        }

        default: {
          // `../:slug/versions/:version`, etc
          if (segment3 === 'versions') {
            if (!overrideDocPermissions && docPermissions?.readVersions) {
              CustomView = {
                ComponentConfig: getCustomViewByKey(views, 'version'),
              }
              DefaultView = {
                Component: DefaultVersionView,
              }
            } else {
              ErrorView = {
                Component: UnauthorizedView,
              }
            }
          } else {
            const baseRoute = [adminRoute !== '/' && adminRoute, 'globals', globalSlug]
              .filter(Boolean)
              .join('/')

            const currentRoute = [baseRoute, segment3, ...remainingSegments]
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

              CustomView = {
                ComponentConfig: CustomViewComponent,
              }
            }
          }

          break
        }
      }
    }
  }

  return {
    CustomView,
    DefaultView,
    ErrorView,
    viewKey,
  }
}
