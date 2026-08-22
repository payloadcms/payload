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
  if (!viewPath) {
    return false
  }

  const keys = []

  // A view path that is not a valid path-to-regexp pattern (e.g. a stray ":")
  // makes pathToRegexp throw, which would crash the whole admin render since
  // this runs inside route-matching `.find` callbacks. Treat an unparseable
  // pattern as a literal string and fall back to plain comparison.
  let match: null | RegExpExecArray = null

  try {
    match = pathToRegexp(viewPath, keys, {
      sensitive,
      strict,
    }).exec(currentRoute)
  } catch {
    match = null
  }

  const viewRoute = match?.[0] || viewPath

  if (exact) {
    return currentRoute === viewRoute
  }

  if (!exact) {
    if (!currentRoute.startsWith(viewRoute)) {
      return false
    }

    const remainingPath = currentRoute.slice(viewRoute.length)

    return remainingPath === '' || remainingPath.startsWith('/')
  }
}
