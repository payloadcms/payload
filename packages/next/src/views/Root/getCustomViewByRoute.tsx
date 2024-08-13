import type { SanitizedConfig } from 'payload'

import type { ViewFromConfig } from './getViewFromConfig.js'

import { isPathMatchingRoute } from './isPathMatchingRoute.js'

export const getCustomViewByRoute = ({
  config,
  currentRoute: currentRouteWithAdmin,
}: {
  config: SanitizedConfig
  currentRoute: string
}): ViewFromConfig => {
  const {
    admin: {
      components: { views },
    },
    routes: { admin: adminRoute },
  } = config

  const currentRoute = currentRouteWithAdmin.replace(adminRoute, '')

  const foundViewConfig =
    views &&
    typeof views === 'object' &&
    Object.entries(views).find(([, view]) => {
      return isPathMatchingRoute({
        currentRoute,
        exact: view.exact,
        path: view.path,
        sensitive: view.sensitive,
        strict: view.strict,
      })
    })?.[1]

  if (!foundViewConfig) {
    return null
  }

  return {
    payloadComponent: foundViewConfig.Component,
  }
}
