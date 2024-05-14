export const authRoutes = [
  '/login',
  '/logout',
  '/create-first-user',
  '/forgot',
  '/reset',
  '/verify',
  '/logout-inactivity',
]

export const isAdminRoute = (route: string, adminRoute: string) => {
  return route.startsWith(adminRoute)
}

export const isAdminAuthRoute = (route: string, adminRoute: string) => {
  return authRoutes.some((r) => route.replace(adminRoute, '').startsWith(r))
}
