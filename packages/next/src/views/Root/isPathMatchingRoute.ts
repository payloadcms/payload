import { pathToRegexp } from 'path-to-regexp'

export type PathMatch = {
  dynamicSegmentCount: number
  matchedLength: number
}

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
}): false | PathMatch => {
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
  const dynamicSegmentCount = keys.length

  if (exact) {
    if (currentRoute === viewRoute) {
      return { dynamicSegmentCount, matchedLength: viewRoute.length }
    }
    return false
  }

  if (!currentRoute.startsWith(viewRoute)) {
    return false
  }

  const remainingPath = currentRoute.slice(viewRoute.length)

  if (remainingPath === '' || remainingPath.startsWith('/')) {
    return { dynamicSegmentCount, matchedLength: viewRoute.length }
  }

  return false
}
