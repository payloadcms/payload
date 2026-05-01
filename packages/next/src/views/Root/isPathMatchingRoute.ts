import { pathToRegexp } from 'path-to-regexp'

export const isPathMatchingRoute = ({
  currentRoute,
  exact,
  path: viewPath,
  sensitive,
  strict,
}: {
  currentRoute: string
  exact?: boolean
  path?: string
  sensitive?: boolean
  strict?: boolean
}) => {
  // if no path is defined, we cannot match it so return false early
  if (!viewPath) {
    return false
  }

  const keys = []

  // run the view path through `pathToRegexp` to resolve any dynamic segments
  // i.e. `/admin/custom-view/:id` -> `/admin/custom-view/123`
  const regex = pathToRegexp(viewPath, keys, {
    sensitive,
    strict,
  })

  const match = regex.exec(currentRoute)
  const viewRoute = match?.[0] || viewPath

  if (exact) {
    return currentRoute === viewRoute
  }

  if (!exact) {
    // `viewRoute` is the portion of `currentRoute` matched by the registered
    // path regex. We check that `viewRoute` starts with `currentRoute` — i.e.
    // the registered route path is at least as long as (or equal to) the
    // current URL segment we are evaluating. This prevents a shorter registered
    // path like `/orders` from matching a longer URL like `/orders/123`.
    //
    // Note: the v3.83.0 regression inverted this to `currentRoute.startsWith(viewRoute)`,
    // which caused list views to shadow detail views (fixes #16321).
    return viewRoute.startsWith(currentRoute)
  }
}
