import { AdminViewComponent } from 'payload/config'
import { SanitizedCollectionConfig, SanitizedConfig, SanitizedGlobalConfig } from 'payload/types'
import { lazy } from 'react'
import { getCustomView } from './getCustomView.tsx'
import { CollectionPermission, GlobalPermission, Permissions } from 'payload/auth'

export const getViewsFromConfig = async ({
  routeSegments,
  docPermissions,
  config,
  collectionConfig,
  globalConfig,
}: {
  routeSegments: string[]
  config: SanitizedConfig
  collectionConfig?: SanitizedCollectionConfig
  globalConfig?: SanitizedGlobalConfig
  docPermissions: CollectionPermission | GlobalPermission
}): Promise<{
  CustomView: AdminViewComponent
  DefaultView: AdminViewComponent
}> => {
  // Conditionally import and lazy load the default view
  let DefaultView: AdminViewComponent
  let CustomView: AdminViewComponent

  const views =
    (collectionConfig && collectionConfig?.admin?.components?.views) ||
    (globalConfig && globalConfig?.admin?.components?.views)

  const livePreviewEnabled =
    (collectionConfig && collectionConfig?.admin?.livePreview) ||
    config?.admin?.livePreview?.collections?.includes(collectionConfig?.slug) ||
    (globalConfig && globalConfig?.admin?.livePreview) ||
    config?.admin?.livePreview?.globals?.includes(globalConfig?.slug)

  if (collectionConfig) {
    // `../:id`, or `../create`
    if (routeSegments?.length === 1) {
      switch (routeSegments[0]) {
        case 'create': {
          if ('create' in docPermissions && docPermissions?.create?.permission) {
            CustomView = getCustomView(views, 'Default')
            DefaultView = lazy(() =>
              import('@payloadcms/ui').then((module) => ({ default: module.DefaultEditView })),
            )
          }
          break
        }

        default: {
          if (docPermissions?.read?.permission) {
            CustomView = getCustomView(views, 'Default')
            DefaultView = lazy(() =>
              import('@payloadcms/ui').then((module) => ({ default: module.DefaultEditView })),
            )
          }
        }
      }
    }

    // `../:id/api`, `../:id/preview`, `../:id/versions`, etc
    if (routeSegments?.length === 2) {
      switch (routeSegments[1]) {
        case 'api': {
          if (collectionConfig?.admin?.hideAPIURL !== true) {
            CustomView = getCustomView(views, 'API')
            DefaultView = lazy(() =>
              import('../API/index.tsx').then((module) => ({ default: module.APIView })),
            )
          }
          break
        }

        case 'preview': {
          if (livePreviewEnabled) {
            // DefaultView = lazy(() =>
            //   import('../LivePreview/index.tsx').then((module) => ({
            //     default: module.LivePreviewView,
            //   })),
            // )
          }
          break
        }

        case 'versions': {
          if (docPermissions?.readVersions?.permission) {
            CustomView = getCustomView(views, 'Versions')
            DefaultView = lazy(() =>
              import('../Versions/index.tsx').then((module) => ({ default: module.VersionsView })),
            )
          }
          break
        }

        default: {
          CustomView = getCustomView(views, 'Default')
          DefaultView = lazy(() =>
            import('@payloadcms/ui').then((module) => ({ default: module.DefaultEditView })),
          )
          break
        }
      }
    }

    // `../:id/versions/:version`, etc
    if (routeSegments?.length === 3) {
      if (routeSegments[1] === 'versions') {
        if (docPermissions?.readVersions?.permission) {
          CustomView = getCustomView(views, 'Version')
          DefaultView = lazy(() =>
            import('../Version/index.tsx').then((module) => ({ default: module.VersionView })),
          )
        }
      }
    }
  }

  if (globalConfig) {
    if (!routeSegments?.length) {
      if (docPermissions?.read?.permission) {
        CustomView = getCustomView(views, 'Default')
        DefaultView = lazy(() =>
          import('@payloadcms/ui').then((module) => ({ default: module.DefaultEditView })),
        )
      }
    } else if (routeSegments?.length === 1) {
      // `../:slug/api`, `../:slug/preview`, `../:slug/versions`, etc
      switch (routeSegments[0]) {
        case 'api': {
          if (globalConfig?.admin?.hideAPIURL !== true) {
            CustomView = getCustomView(views, 'API')
            DefaultView = lazy(() =>
              import('../API/index.tsx').then((module) => ({ default: module.APIView })),
            )
          }
          break
        }

        case 'preview': {
          if (livePreviewEnabled) {
            // DefaultView = lazy(() =>
            //   import('../LivePreview/index.tsx').then((module) => ({
            //     default: module.LivePreviewView,
            //   })),
            // )
          }
          break
        }

        case 'versions': {
          if (docPermissions?.readVersions?.permission) {
            CustomView = getCustomView(views, 'Versions')
            DefaultView = lazy(() =>
              import('../Versions/index.tsx').then((module) => ({ default: module.VersionsView })),
            )
          }
          break
        }

        default: {
          if (docPermissions?.read?.permission) {
            CustomView = getCustomView(views, 'Default')
            DefaultView = lazy(() =>
              import('@payloadcms/ui').then((module) => ({ default: module.DefaultEditView })),
            )
          }
          break
        }
      }
    } else if (routeSegments?.length === 2) {
      // `../:slug/versions/:version`, etc
      if (routeSegments[1] === 'versions') {
        if (docPermissions?.readVersions?.permission) {
          CustomView = getCustomView(views, 'Version')
          DefaultView = lazy(() =>
            import('../Version/index.tsx').then((module) => ({ default: module.VersionView })),
          )
        }
      }
    }
  }

  return {
    CustomView,
    DefaultView,
  }
}
