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
    return viewRoute.startsWith(currentRoute)
  }
}
