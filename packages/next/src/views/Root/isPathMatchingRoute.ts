import { pathToRegexp } from 'path-to-regexp'
import { stripTrailingSlash } from 'payload/shared'

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

  const normalizedCurrentRoute = strict ? currentRoute : stripTrailingSlash(currentRoute)
  const keys = []

  // run the view path through `pathToRegexp` to resolve any dynamic segments
  // i.e. `/admin/custom-view/:id` -> `/admin/custom-view/123`
  const regex = pathToRegexp(viewPath, keys, {
    sensitive,
    strict,
  })

  const match = regex.exec(normalizedCurrentRoute)
  const viewRoute = strict ? match?.[0] || viewPath : stripTrailingSlash(match?.[0] || viewPath)

  if (exact) {
    return normalizedCurrentRoute === viewRoute
  }

  if (!exact) {
    if (!normalizedCurrentRoute.startsWith(viewRoute)) {
      return false
    }

    const remainingPath = normalizedCurrentRoute.slice(viewRoute.length)

    return remainingPath === '' || remainingPath.startsWith('/')
  }
}
