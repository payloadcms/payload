import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen.js'

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
