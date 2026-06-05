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
    if (!currentRoute.startsWith(viewRoute)) {
      return false
    }

    const remainingPath = currentRoute.slice(viewRoute.length)

    return remainingPath === '' || remainingPath.startsWith('/')
  }
}
