import type { AdminViewComponent, SanitizedConfig } from 'payload/types'

import { isPathMatchingRoute } from './isPathMatchingRoute.js'

export const getCustomViewByRoute = ({
  config,
  currentRoute: currentRouteWithAdmin,
}: {
  config: SanitizedConfig
  currentRoute: string
}): {
  ViewToRender: AdminViewComponent
  templateClassname?: string
  templateType: 'default' | 'minimal' | 'none'
} | null => {
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
        return isPathMatchingRoute({
          currentRoute,
          exact: view.exact,
          path: view.path,
          sensitive: view.sensitive,
          strict: view.strict,
        })
      }
    })?.[1]

  return typeof foundViewConfig === 'object'
    ? {
        ViewToRender: foundViewConfig.Component,
        templateClassname: foundViewConfig.templateClass,
        templateType: foundViewConfig.templateType,
      }
    : null
}
