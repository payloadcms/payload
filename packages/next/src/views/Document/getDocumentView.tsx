import type React from 'react'

import {
  type DocumentViewClientProps,
  type DocumentViewServerProps,
  type EditViewComponent,
  type PayloadComponent,
  type SanitizedCollectionConfig,
  type SanitizedCollectionPermission,
  type SanitizedConfig,
  type SanitizedGlobalConfig,
  type SanitizedGlobalPermission,
} from 'payload'

import { getViewByKeyOrRoute } from './getViewByKeyOrRoute.js'

export type ViewFromConfig<TProps extends object> = {
  Component?: React.FC<TProps>
  ComponentConfig?: PayloadComponent<TProps>
}

export type ViewToRender =
  | EditViewComponent
  | PayloadComponent<DocumentViewServerProps>
  | React.FC
  | React.FC<DocumentViewClientProps>

/**
 * This function is used to determine which document-level view to render based on the current route.
 *
 * For example, if the user is on the `../:id/api` route, this function will return the API view (with exceptions, see below).
 *
 * To match a route to a view, the order of operations is as follows:
 *   1. If the route is a "known" route, e.g. `/api`:
 *     a. If the user has NOT overridden the `path`, render the corresponding view, whether default or custom
 *     b. If the user HAS overriden the `path`, do NOT render the view here, as it now exists at a different route.
 *   2. If 1b is true, look for another view that may be occupying this path.
 *
 * This needs to be as performant as possible, as it is calculated on every request. To do this, we should avoid looping
 * through the entire `views` config and avoid running `path-to-regexp` as much as possible until absolutely necessary.
 * For example, we cannot do something like a "view map" where we generate all possible routes ahead of time, as that would require
 * looping through the entire config once to generate routes, and then a second time to run `path-to-regexp` against every route.
 */
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

  if (!docPermissions?.read) {
    throw new Error('not-found')
  }

  if (collectionConfig) {
    const [collectionEntity, collectionSlug, segment3, segment4] = routeSegments

    const basePath = [adminRoute !== '/' && adminRoute, collectionEntity, collectionSlug, ':id']
      .filter(Boolean)
      .join('/')

    const currentRoute = [adminRoute !== '/' && adminRoute, ...routeSegments]
      .filter(Boolean)
      .join('/')

    const getView = (key?: string) =>
      getViewByKeyOrRoute({
        basePath,
        collectionConfig,
        config,
        currentRoute,
        viewKey: key,
      })

    switch (routeSegments.length) {
      // --> ../collections/posts/create
      // --> ../collections/posts/:id
      case 3: {
        switch (segment3) {
          // --> ../collections/posts/create
          case 'create': {
            View = getView('default').Component
            break
          }

          // --> ../collections/posts/:id
          default: {
            View = getView('default').Component
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
            View = getView('api').Component
            break
          }

          // --> ../:id/preview
          case 'preview': {
            View = getView('livePreview').Component
            break
          }

          // --> ../:id/versions
          case 'versions': {
            View = getView('versions').Component
            break
          }

          // --> ../:id/<custom-segment>
          default: {
            const { Component: CustomViewComponent, viewKey: customViewKey } = getView()

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
          View = getView('version').Component
        } else {
          // --> ../:id/<custom-segment>/<custom-segment>
          const { Component: CustomViewComponent, viewKey: customViewKey } = getView()

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
    const [globalEntity, globalSlug, segment3] = routeSegments

    const basePath = [adminRoute !== '/' && adminRoute, globalEntity, globalSlug]
      .filter(Boolean)
      .join('/')

    const currentRoute = [adminRoute !== '/' && adminRoute, ...routeSegments]
      .filter(Boolean)
      .join('/')

    const getView = (key?: string) =>
      getViewByKeyOrRoute({
        basePath,
        config,
        currentRoute,
        globalConfig,
        viewKey: key,
      })

    switch (routeSegments.length) {
      // --> ../:slug
      case 2: {
        View = getView('default').Component
        break
      }

      case 3: {
        // --> ../:slug/api
        // --> ../:slug/preview
        // --> ../:slug/versions
        switch (segment3) {
          // --> ../:slug/api
          case 'api': {
            View = getView('api').Component
            break
          }

          // --> ../:slug/preview
          case 'preview': {
            View = getView('livePreview').Component
            break
          }

          // --> ../:slug/versions
          case 'versions': {
            View = getView('versions').Component
            break
          }

          // --> ../:slug/<custom-segment>
          default: {
            const { Component: CustomViewComponent, viewKey: customViewKey } = getView()

            if (customViewKey) {
              viewKey = customViewKey
              View = CustomViewComponent
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
          View = getView('version').Component
        } else {
          // --> ../:slug/<custom-segment>/<custom-segment>
          const { Component: CustomViewComponent, viewKey: customViewKey } = getView()

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
