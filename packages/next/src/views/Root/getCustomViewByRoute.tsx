import type { AdminViewComponent, SanitizedConfig } from 'payload/types'

import { pathToRegexp } from 'path-to-regexp'

export const getCustomViewByRoute = ({
  config,
  currentRoute: currentRouteWithAdmin,
}: {
  config: SanitizedConfig
  currentRoute: string
}): AdminViewComponent => {
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
      if (typeof view === 'object') {
        const { exact, path: viewPath, sensitive, strict } = view

        const keys = []

        // run the view path through `pathToRegexp` to resolve any dynamic segments
        // i.e. `/admin/custom-view/:id` -> `/admin/custom-view/123`
        const regex = pathToRegexp(viewPath, keys, {
          sensitive,
          strict,
        })

        const match = regex.exec(currentRoute)
        const viewRoute = match?.[0] || viewPath

        if (exact) return currentRoute === viewRoute
        if (!exact) return viewRoute.startsWith(currentRoute)
      }
    })?.[1]

  return typeof foundViewConfig === 'object' ? foundViewConfig.Component : null
}
