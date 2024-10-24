import type { AdminViewConfig, PayloadRequest, SanitizedConfig } from 'payload'

import { getRouteWithoutAdmin } from './shared.js'

type PublicCustomView = Pick<AdminViewConfig, 'access' | 'exact' | 'path'>

/**
 * Determines if a custom view should be public by checking if the route passes the access control
 */
export const checkCustomViewAccess = async ({
  adminRoute,
  canAccessAdmin = false,
  config,
  req,
  route,
}: {
  adminRoute: string
  canAccessAdmin: boolean
  config: SanitizedConfig
  req: PayloadRequest
  route: string
}): Promise<{ access: boolean; hasMatch: boolean }> => {
  const routeWithoutAdmin = getRouteWithoutAdmin({ adminRoute, route })
  const publicViews = getMatchingPublicCustomViews({ config, routeWithoutAdmin })

  let hasMatch = false
  let access = false

  if (publicViews.length) {
    hasMatch = true
  }

  for await (const view of publicViews) {
    const canAccess = await view.access({
      canAccessAdmin,
      isExact: view.exact || false,
      path: view.path,
      req,
      route,
    })

    if (canAccess) {
      access = true
      break
    }
  }

  return { access, hasMatch }
}

/**
 * Returns an array of views marked with 'public: true' in the config
 */
export const getMatchingPublicCustomViews = ({
  config,
  routeWithoutAdmin,
}: {
  config: SanitizedConfig
  routeWithoutAdmin: string
}): PublicCustomView[] => {
  const publicViews: PublicCustomView[] = []

  if (config.admin?.components?.views) {
    Object.entries(config.admin.components.views).forEach(([_, view]) => {
      if (view.access) {
        if (view.exact) {
          if (routeWithoutAdmin === view.path) {
            publicViews.push({ access: view.access, exact: view.exact, path: view.path })
          }
        } else {
          if (routeWithoutAdmin.startsWith(view.path)) {
            publicViews.push({ access: view.access, exact: view.exact, path: view.path })
          }
        }
      }
    })
  }

  return publicViews
}
