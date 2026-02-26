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
    admin: {
      components: { views },
    },
    routes: { admin: adminRoute },
  } = config

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

  const adminConfig = getAdminConfig()
  const adminViewComponent = adminConfig.admin?.views?.[viewKey]?.Component

  if (adminViewComponent) {
    return {
      view: {
        Component: adminViewComponent as React.FC<AdminViewServerProps>,
      },
      viewConfig: foundViewConfig,
      viewKey,
    }
  }

  return {
    view: {
      payloadComponent: foundViewConfig.Component,
    },
    viewConfig: foundViewConfig,
    viewKey,
  }
}
