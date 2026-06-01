export const getRouteWithoutAdmin = ({
  adminRoute,
  route,
}: {
  adminRoute: string
  route: string
}): string => {
  return adminRoute && adminRoute !== '/' ? route.replace(adminRoute, '') : route
}
