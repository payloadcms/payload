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

  const normalizeTrailingSlash = (path: string) => {
    if (strict || path === '/') {
      return path
    }

    return path.replace(/\/$/, '')
  }

  const normalizedCurrentRoute = normalizeTrailingSlash(currentRoute)
  const keys = []

  const regex = pathToRegexp(viewPath, keys, {
    sensitive,
    strict,
  })

  const match = regex.exec(normalizedCurrentRoute)
  const viewRoute = normalizeTrailingSlash(match?.[0] || viewPath)

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
