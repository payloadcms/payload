import type { AdminViewConfig, AdminViewServerProps, SanitizedConfig } from 'payload'
import type React from 'react'

import type { ViewFromConfig } from './getRouteData.js'

import { getAdminConfig } from '../../utilities/adminConfigCache.js'
import { isPathMatchingRoute } from './isPathMatchingRoute.js'

export const getCustomViewByRoute = ({
  config,
  currentRoute: currentRouteWithAdmin,
}: {
  config: SanitizedConfig
  currentRoute: string
}): {
  view: ViewFromConfig
  viewConfig: AdminViewConfig
  viewKey: string
} => {
  const {
    routes: { admin: adminRoute },
  } = config

  const adminConfig = getAdminConfig()
  const views = adminConfig.admin?.views ?? config.admin?.components?.views

  let viewKey: string

  const currentRoute =
    adminRoute === '/' ? currentRouteWithAdmin : currentRouteWithAdmin.replace(adminRoute, '')

  const foundViewConfig =
    (views &&
      typeof views === 'object' &&
      Object.entries(views).find(([key, view]) => {
        const isMatching = isPathMatchingRoute({
          currentRoute,
          exact: view.exact,
          path: view.path,
          sensitive: view.sensitive,
          strict: view.strict,
        })

        if (isMatching) {
          viewKey = key
        }

        return isMatching
      })?.[1]) ||
    undefined

  if (!foundViewConfig) {
    return {
      view: {
        Component: null,
      },
      viewConfig: null,
      viewKey: null,
    }
  }

  const Component = foundViewConfig.Component

  if (Component && typeof Component === 'function') {
    return {
      view: {
        Component: Component as React.FC<AdminViewServerProps>,
      },
      viewConfig: foundViewConfig as AdminViewConfig,
      viewKey,
    }
  }

  return {
    view: {
      payloadComponent: Component,
    },
    viewConfig: foundViewConfig as AdminViewConfig,
    viewKey,
  }
}
