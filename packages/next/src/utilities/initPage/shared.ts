import type { SanitizedConfig } from 'payload'

const authRouteKeys: (keyof SanitizedConfig['admin']['routes'])[] = [
  'createFirstUser',
  'forgot',
  'login',
  'logout',
  'forgot',
  'inactivity',
  'unauthorized',
  'reset',
]

export const isAdminRoute = ({
  adminRoute,
  config,
  route,
}: {
  adminRoute: string
  config: SanitizedConfig
  route: string
}): boolean => {
  return route.startsWith(adminRoute) && !isAdminAuthRoute({ adminRoute, config, route })
}

export const isAdminAuthRoute = ({
  adminRoute,
  config,
  route,
}: {
  adminRoute: string
  config: SanitizedConfig
  route: string
}): boolean => {
  const authRoutes = config.admin?.routes
    ? Object.entries(config.admin.routes)
        .filter(([key]) => authRouteKeys.includes(key as keyof SanitizedConfig['admin']['routes']))
        .map(([_, value]) => value)
    : []

  return authRoutes.some((r) => getRouteWithoutAdmin({ adminRoute, route }).startsWith(r))
}

export const isGraphQLPlaygroundRoute = ({
  adminRoute,
  config: {
    admin: {
      routes: { graphqlPlayground },
    },
  },
  route,
}: {
  adminRoute: string
  config: SanitizedConfig
  route: string
}): boolean => {
  return getRouteWithoutAdmin({ adminRoute, route }) === graphqlPlayground
}

export const getRouteWithoutAdmin = ({
  adminRoute,
  route,
}: {
  adminRoute: string
  route: string
}): string => {
  return adminRoute && adminRoute !== '/' ? route.replace(adminRoute, '') : route
}
