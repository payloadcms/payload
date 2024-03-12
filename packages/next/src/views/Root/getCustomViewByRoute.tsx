import type { AdminViewComponent, SanitizedConfig } from 'payload/types'

export const getCustomViewByRoute = ({
  config,
  route,
}: {
  config: SanitizedConfig
  route: string
}): AdminViewComponent => {
  const {
    admin: {
      components: { views },
    },
    routes: { admin: adminRoute },
  } = config

  const routeWithoutAdmin = route.replace(adminRoute, '')

  // TODO: explore `match`, `exact`, etc
  const matched = Object.entries(views).find(
    ([, view]) => typeof view === 'object' && view.path === routeWithoutAdmin,
  )?.[1]

  return typeof matched === 'object' ? matched.Component : null
}
