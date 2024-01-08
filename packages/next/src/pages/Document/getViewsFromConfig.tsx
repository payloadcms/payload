import { AdminViewComponent } from 'payload/config'
import { SanitizedCollectionConfig, SanitizedGlobalConfig } from 'payload/types'
import { lazy } from 'react'
import { getCustomView } from './getCustomView.tsx'

export const getViewsFromConfig = async ({
  views,
  routeSegments,
  isCollection,
  isGlobal,
}: {
  views:
    | SanitizedCollectionConfig['admin']['components']['views']
    | SanitizedGlobalConfig['admin']['components']['views']
  routeSegments: string[]
  isCollection?: boolean
  isGlobal?: boolean
}): Promise<{
  CustomView: AdminViewComponent
  DefaultView: AdminViewComponent
}> => {
  // Conditionally import and lazy load the default view
  let DefaultView: AdminViewComponent
  let CustomView: AdminViewComponent

  if (isCollection) {
    // `../:id`, or `../create`
    if (routeSegments?.length === 1) {
      switch (routeSegments[0]) {
        case 'create':
          DefaultView = lazy(() =>
            import('@payloadcms/ui').then((module) => ({ default: module.DefaultEditView })),
          )
          CustomView = getCustomView(views, 'Default')
          break
        default:
          DefaultView = lazy(() =>
            import('@payloadcms/ui').then((module) => ({ default: module.DefaultEditView })),
          )
          CustomView = getCustomView(views, 'Default')
          break
      }
    }

    // `../:id/api`, `../:id/preview`, `../:id/versions`, etc
    if (routeSegments?.length === 2) {
      switch (routeSegments[1]) {
        case 'api': {
          DefaultView = lazy(() =>
            import('../API/index.tsx').then((module) => ({ default: module.APIView })),
          )
          CustomView = getCustomView(views, 'API')
          break
        }
        case 'preview': {
          // DefaultView = lazy(() =>
          //   import('../LivePreview/index.tsx').then((module) => ({
          //     default: module.LivePreviewView,
          //   })),
          // )
          break
        }
        case 'versions': {
          DefaultView = lazy(() =>
            import('../Versions/index.tsx').then((module) => ({ default: module.VersionsView })),
          )
          CustomView = getCustomView(views, 'Versions')
          break
        }
        default: {
          DefaultView = lazy(() =>
            import('@payloadcms/ui').then((module) => ({ default: module.DefaultEditView })),
          )
          CustomView = getCustomView(views, 'Default')
          break
        }
      }
    }

    // `../:id/versions/:version`, etc
    if (routeSegments?.length === 3) {
      if (routeSegments[1] === 'versions') {
        DefaultView = lazy(() =>
          import('../Version/index.tsx').then((module) => ({ default: module.VersionView })),
        )
        CustomView = getCustomView(views, 'Version')
      }
    }
  }

  if (isGlobal) {
    if (!routeSegments?.length) {
      DefaultView = lazy(() =>
        import('@payloadcms/ui').then((module) => ({ default: module.DefaultEditView })),
      )
      CustomView = getCustomView(views, 'Default')
    }

    // `../:slug/api`, `../:slug/preview`, `../:slug/versions`, etc
    if (routeSegments?.length === 1) {
      switch (routeSegments[0]) {
        case 'api': {
          DefaultView = lazy(() =>
            import('../API/index.tsx').then((module) => ({ default: module.APIView })),
          )
          CustomView = getCustomView(views, 'API')
          break
        }
        case 'preview': {
          // DefaultView = lazy(() =>
          //   import('../LivePreview/index.tsx').then((module) => ({
          //     default: module.LivePreviewView,
          //   })),
          // )
          break
        }
        case 'versions': {
          DefaultView = lazy(() =>
            import('../Versions/index.tsx').then((module) => ({ default: module.VersionsView })),
          )
          CustomView = getCustomView(views, 'Versions')
          break
        }
        default: {
          DefaultView = lazy(() =>
            import('@payloadcms/ui').then((module) => ({ default: module.DefaultEditView })),
          )
          CustomView = getCustomView(views, 'Default')
          break
        }
      }
    }

    // `../:slug/versions/:version`, etc
    if (routeSegments?.length === 2) {
      if (routeSegments[0] === 'versions') {
        DefaultView = lazy(() =>
          import('../Version/index.tsx').then((module) => ({ default: module.VersionView })),
        )
        CustomView = getCustomView(views, 'Version')
      }
    }
  }

  return {
    CustomView,
    DefaultView,
  }
}
